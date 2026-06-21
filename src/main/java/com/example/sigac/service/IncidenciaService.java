package com.example.sigac.service;

import com.example.sigac.audit.AuditAction;
import com.example.sigac.audit.AuditService;
import com.example.sigac.dto.request.*;
import com.example.sigac.dto.response.IncidenciaMultimediaResponse;
import com.example.sigac.dto.response.IncidenciaResponse;
import com.example.sigac.dto.response.PresignedUrlResponse;
import com.example.sigac.exception.BadRequestException;
import com.example.sigac.exception.ResourceNotFoundException;
import com.example.sigac.exception.UnauthorizedException;
import com.example.sigac.model.*;
import com.example.sigac.repository.EntidadRepository;
import com.example.sigac.repository.IncidenciaMultimediaRepository;
import com.example.sigac.repository.IncidenciaRepository;
import com.example.sigac.repository.UsuarioRepository;
import com.example.sigac.event.IncidenciaCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidenciaService {

    private final IncidenciaRepository incidenciaRepository;
    private final IncidenciaMultimediaRepository multimediaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EntidadRepository entidadRepository;
    private final AuditService auditService;
    private final S3Service s3Service;
    private final ApplicationEventPublisher eventPublisher;

    private static final int MAX_MULTIMEDIA_POR_INCIDENCIA = 10;

    // ─── CRUD de incidencias ─────────────────────────────────────────────────

    @Transactional
    public IncidenciaResponse crear(CreateIncidenciaRequest request) {
        Usuario ciudadano = obtenerUsuarioAutenticado();

        Incidencia incidencia = Incidencia.builder()
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .categoria(request.getCategoria())
                .estado(EstadoIncidencia.PENDIENTE)
                .prioridad(request.getPrioridad() != null ? request.getPrioridad() : PrioridadIncidencia.MEDIA)
                .ciudadano(ciudadano)
                .latitud(request.getLatitud())
                .longitud(request.getLongitud())
                .direccionReferencia(request.getDireccionReferencia())
                .build();

        Incidencia guardada = incidenciaRepository.save(incidencia);

        auditService.log(AuditAction.INCIDENT_CREATE, "incidencia", guardada.getId(),
                null, guardada.getTitulo(),
                ciudadano.getId(), ciudadano.getEmail(), ciudadano.getRol().name());

        eventPublisher.publishEvent(new IncidenciaCreatedEvent(guardada.getId(), guardada.getTitulo(), guardada.getDescripcion()));

        log.info("Incidencia {} creada por {}", guardada.getId(), ciudadano.getEmail());
        return convertToDTO(guardada);
    }

    @Transactional(readOnly = true)
    public Page<IncidenciaResponse> obtenerTodas(int page, int size, EstadoIncidencia estado) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Incidencia> resultado = estado != null
                ? incidenciaRepository.findByEstadoOrderByFechaCreacionDesc(estado, pageable)
                : incidenciaRepository.findAllByOrderByFechaCreacionDesc(pageable);
        return resultado.map(this::convertToDTOSummary);
    }

    @Transactional(readOnly = true)
    public Page<IncidenciaResponse> obtenerMisIncidencias(int page, int size, EstadoIncidencia estado) {
        Usuario ciudadano = obtenerUsuarioAutenticado();
        Pageable pageable = PageRequest.of(page, size);
        Page<Incidencia> resultado = estado != null
                ? incidenciaRepository.findByCiudadanoIdAndEstadoOrderByFechaCreacionDesc(ciudadano.getId(), estado, pageable)
                : incidenciaRepository.findByCiudadanoIdOrderByFechaCreacionDesc(ciudadano.getId(), pageable);
        return resultado.map(this::convertToDTOSummary);
    }

    @Transactional(readOnly = true)
    public Page<IncidenciaResponse> obtenerPorEntidad(int page, int size, EstadoIncidencia estado) {
        Usuario funcionario = obtenerUsuarioAutenticado();
        if (funcionario.getEntidad() == null) {
            throw new BadRequestException("El usuario no pertenece a ninguna entidad");
        }
        Long entidadId = funcionario.getEntidad().getId();
        Pageable pageable = PageRequest.of(page, size);
        Page<Incidencia> resultado = estado != null
                ? incidenciaRepository.findByEntidadAsignadaIdAndEstadoOrderByFechaCreacionDesc(entidadId, estado, pageable)
                : incidenciaRepository.findByEntidadAsignadaIdOrderByFechaCreacionDesc(entidadId, pageable);
        return resultado.map(this::convertToDTOSummary);
    }

    @Transactional(readOnly = true)
    public IncidenciaResponse obtenerPorId(Long id) {
        Incidencia incidencia = obtenerIncidenciaOFail(id);
        verificarAccesoLectura(incidencia);
        return convertToDTO(incidencia);
    }

    @Transactional
    public IncidenciaResponse actualizar(Long id, UpdateIncidenciaRequest request) {
        Usuario actor = obtenerUsuarioAutenticado();
        Incidencia incidencia = obtenerIncidenciaOFail(id);

        if (actor.getRol() == Role.CIUDADANO) {
            if (!incidencia.getCiudadano().getId().equals(actor.getId())) {
                throw new UnauthorizedException("No tiene permisos para modificar esta incidencia");
            }
            if (incidencia.getEstado() != EstadoIncidencia.PENDIENTE) {
                throw new BadRequestException("Solo se pueden editar incidencias en estado PENDIENTE");
            }
        }

        String prevTitulo = incidencia.getTitulo();
        aplicarCambiosIncidencia(incidencia, request);
        Incidencia guardada = incidenciaRepository.save(incidencia);

        auditService.log(AuditAction.INCIDENT_UPDATE, "incidencia", guardada.getId(),
                "titulo=" + prevTitulo, "titulo=" + guardada.getTitulo(),
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Incidencia {} actualizada por {}", guardada.getId(), actor.getEmail());
        return convertToDTO(guardada);
    }

    @Transactional
    public IncidenciaResponse cambiarEstado(Long id, CambiarEstadoRequest request) {
        Usuario actor = obtenerUsuarioAutenticado();
        Incidencia incidencia = obtenerIncidenciaOFail(id);

        if (actor.getRol() == Role.ENTIDAD_PUBLICA) {
            if (actor.getEntidad() == null || incidencia.getEntidadAsignada() == null ||
                    !incidencia.getEntidadAsignada().getId().equals(actor.getEntidad().getId())) {
                throw new UnauthorizedException("Solo puede cambiar el estado de incidencias asignadas a su entidad");
            }
            EstadoIncidencia nuevo = request.getEstado();
            if (nuevo != EstadoIncidencia.RESUELTO && nuevo != EstadoIncidencia.RECHAZADO && nuevo != EstadoIncidencia.EN_PROCESO) {
                throw new BadRequestException("Las entidades solo pueden cambiar el estado a EN_PROCESO, RESUELTO o RECHAZADO");
            }
        }

        EstadoIncidencia estadoAnterior = incidencia.getEstado();
        incidencia.setEstado(request.getEstado());

        if (request.getEstado() == EstadoIncidencia.RESUELTO || request.getEstado() == EstadoIncidencia.RECHAZADO) {
            incidencia.setFechaResolucion(LocalDateTime.now());
        }

        Incidencia guardada = incidenciaRepository.save(incidencia);

        auditService.log(AuditAction.INCIDENT_STATUS_CHANGE, "incidencia", guardada.getId(),
                estadoAnterior.name(), guardada.getEstado().name(),
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Estado de incidencia {} cambiado de {} a {} por {}",
                guardada.getId(), estadoAnterior, guardada.getEstado(), actor.getEmail());
        return convertToDTO(guardada);
    }

    @Transactional
    public IncidenciaResponse asignar(Long id, AsignarIncidenciaRequest request) {
        Usuario actor = obtenerUsuarioAutenticado();
        Incidencia incidencia = obtenerIncidenciaOFail(id);

        Entidad entidad = entidadRepository.findById(request.getEntidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Entidad no encontrada"));

        if (!entidad.getActivo()) {
            throw new BadRequestException("La entidad seleccionada está inactiva");
        }

        Long entidadAnteriorId = incidencia.getEntidadAsignada() != null
                ? incidencia.getEntidadAsignada().getId() : null;

        incidencia.setEntidadAsignada(entidad);
        if (incidencia.getEstado() == EstadoIncidencia.PENDIENTE) {
            incidencia.setEstado(EstadoIncidencia.EN_REVISION);
        }

        Incidencia guardada = incidenciaRepository.save(incidencia);

        auditService.log(AuditAction.INCIDENT_ASSIGN, "incidencia", guardada.getId(),
                entidadAnteriorId != null ? "entidad=" + entidadAnteriorId : null,
                "entidad=" + entidad.getId() + "(" + entidad.getNombre() + ")",
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Incidencia {} asignada a entidad {}({}) por {}",
                guardada.getId(), entidad.getNombre(), entidad.getId(), actor.getEmail());
        return convertToDTO(guardada);
    }

    @Transactional
    public void eliminar(Long id) {
        Usuario actor = obtenerUsuarioAutenticado();
        Incidencia incidencia = obtenerIncidenciaOFail(id);

        if (actor.getRol() == Role.CIUDADANO) {
            if (!incidencia.getCiudadano().getId().equals(actor.getId())) {
                throw new UnauthorizedException("No tiene permisos para eliminar esta incidencia");
            }
            if (incidencia.getEstado() != EstadoIncidencia.PENDIENTE) {
                throw new BadRequestException("Solo se pueden eliminar incidencias en estado PENDIENTE");
            }
        }

        incidencia.getMultimedia().forEach(m -> s3Service.eliminarObjeto(m.getS3Key()));

        auditService.log(AuditAction.INCIDENT_DELETE, "incidencia", incidencia.getId(),
                incidencia.getTitulo(), null,
                actor.getId(), actor.getEmail(), actor.getRol().name());

        incidenciaRepository.delete(incidencia);
        log.info("Incidencia {} eliminada por {}", id, actor.getEmail());
    }

    // ─── Multimedia ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PresignedUrlResponse generarUrlSubida(Long incidenciaId, PresignedUrlRequest request) {
        Usuario ciudadano = obtenerUsuarioAutenticado();
        Incidencia incidencia = obtenerIncidenciaOFail(incidenciaId);

        if (!incidencia.getCiudadano().getId().equals(ciudadano.getId())) {
            throw new UnauthorizedException("No tiene permisos para agregar multimedia a esta incidencia");
        }

        long totalMultimedia = multimediaRepository.countByIncidenciaId(incidenciaId);
        if (totalMultimedia >= MAX_MULTIMEDIA_POR_INCIDENCIA) {
            throw new BadRequestException("Se ha alcanzado el máximo de " + MAX_MULTIMEDIA_POR_INCIDENCIA + " archivos por incidencia");
        }

        String s3Key = s3Service.generarKeySubida(incidenciaId, request.getFileName());
        String presignedUrl = s3Service.generarPresignedUrlSubida(s3Key, request.getContentType());

        return PresignedUrlResponse.builder()
                .presignedUrl(presignedUrl)
                .s3Key(s3Key)
                .expiresInMinutes(15)
                .build();
    }

    @Transactional
    public IncidenciaMultimediaResponse confirmarSubida(Long incidenciaId, ConfirmarMultimediaRequest request) {
        Usuario ciudadano = obtenerUsuarioAutenticado();
        Incidencia incidencia = obtenerIncidenciaOFail(incidenciaId);

        if (!incidencia.getCiudadano().getId().equals(ciudadano.getId())) {
            throw new UnauthorizedException("No tiene permisos para agregar multimedia a esta incidencia");
        }

        long totalMultimedia = multimediaRepository.countByIncidenciaId(incidenciaId);
        if (totalMultimedia >= MAX_MULTIMEDIA_POR_INCIDENCIA) {
            throw new BadRequestException("Se ha alcanzado el máximo de " + MAX_MULTIMEDIA_POR_INCIDENCIA + " archivos por incidencia");
        }

        IncidenciaMultimedia multimedia = IncidenciaMultimedia.builder()
                .incidencia(incidencia)
                .s3Key(request.getS3Key())
                .nombreOriginal(request.getNombreOriginal())
                .tipoContenido(request.getContentType())
                .tamanoBytes(request.getTamanoBytes())
                .orden((int) totalMultimedia)
                .build();

        IncidenciaMultimedia guardado = multimediaRepository.save(multimedia);
        log.info("Multimedia {} registrada para incidencia {}", guardado.getId(), incidenciaId);
        return convertMultimediaToDTO(guardado);
    }

    @Transactional
    public void eliminarMultimedia(Long incidenciaId, Long multimediaId) {
        Usuario actor = obtenerUsuarioAutenticado();
        Incidencia incidencia = obtenerIncidenciaOFail(incidenciaId);

        if (actor.getRol() == Role.CIUDADANO && !incidencia.getCiudadano().getId().equals(actor.getId())) {
            throw new UnauthorizedException("No tiene permisos para eliminar multimedia de esta incidencia");
        }

        IncidenciaMultimedia multimedia = multimediaRepository.findById(multimediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Multimedia no encontrada"));

        if (!multimedia.getIncidencia().getId().equals(incidenciaId)) {
            throw new BadRequestException("El archivo no pertenece a esta incidencia");
        }

        s3Service.eliminarObjeto(multimedia.getS3Key());
        multimediaRepository.delete(multimedia);
        log.info("Multimedia {} eliminada de incidencia {} por {}", multimediaId, incidenciaId, actor.getEmail());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Usuario no autenticado");
        }
        return usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private Incidencia obtenerIncidenciaOFail(Long id) {
        return incidenciaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incidencia no encontrada con id: " + id));
    }

    private void verificarAccesoLectura(Incidencia incidencia) {
        Usuario usuario = obtenerUsuarioAutenticado();
        if (usuario.getRol() == Role.CIUDADANO &&
                !incidencia.getCiudadano().getId().equals(usuario.getId())) {
            throw new UnauthorizedException("No tiene permisos para ver esta incidencia");
        }
        if (usuario.getRol() == Role.ENTIDAD_PUBLICA &&
                (usuario.getEntidad() == null || incidencia.getEntidadAsignada() == null ||
                        !incidencia.getEntidadAsignada().getId().equals(usuario.getEntidad().getId()))) {
            throw new UnauthorizedException("No tiene permisos para ver esta incidencia");
        }
    }

    private void aplicarCambiosIncidencia(Incidencia incidencia, UpdateIncidenciaRequest request) {
        if (request.getTitulo() != null && !request.getTitulo().isBlank()) {
            incidencia.setTitulo(request.getTitulo());
        }
        if (request.getDescripcion() != null && !request.getDescripcion().isBlank()) {
            incidencia.setDescripcion(request.getDescripcion());
        }
        if (request.getCategoria() != null) {
            incidencia.setCategoria(request.getCategoria());
        }
        if (request.getPrioridad() != null) {
            incidencia.setPrioridad(request.getPrioridad());
        }
        if (request.getLatitud() != null) {
            incidencia.setLatitud(request.getLatitud());
        }
        if (request.getLongitud() != null) {
            incidencia.setLongitud(request.getLongitud());
        }
        if (request.getDireccionReferencia() != null) {
            incidencia.setDireccionReferencia(request.getDireccionReferencia());
        }
    }

    // Detalle completo — incluye multimedia con presigned URLs (solo para GET /id)
    private IncidenciaResponse convertToDTO(Incidencia incidencia) {
        List<IncidenciaMultimediaResponse> multimediaResponse = incidencia.getMultimedia().stream()
                .map(this::convertMultimediaToDTO)
                .toList();
        return buildResponse(incidencia, multimediaResponse);
    }

    // Resumen para listas paginadas — sin multimedia para evitar N+1 y llamadas a S3
    private IncidenciaResponse convertToDTOSummary(Incidencia incidencia) {
        return buildResponse(incidencia, List.of());
    }

    private IncidenciaResponse buildResponse(Incidencia incidencia, List<IncidenciaMultimediaResponse> multimedia) {
        return IncidenciaResponse.builder()
                .id(incidencia.getId())
                .titulo(incidencia.getTitulo())
                .descripcion(incidencia.getDescripcion())
                .categoria(incidencia.getCategoria().name())
                .estado(incidencia.getEstado().name())
                .prioridad(incidencia.getPrioridad().name())
                .ciudadanoId(incidencia.getCiudadano().getId())
                .ciudadanoNombre(incidencia.getCiudadano().getNombre())
                .ciudadanoEmail(incidencia.getCiudadano().getEmail())
                .entidadAsignadaId(incidencia.getEntidadAsignada() != null ? incidencia.getEntidadAsignada().getId() : null)
                .entidadAsignadaNombre(incidencia.getEntidadAsignada() != null ? incidencia.getEntidadAsignada().getNombre() : null)
                .entidadAsignadaTipo(incidencia.getEntidadAsignada() != null ? incidencia.getEntidadAsignada().getTipo().name() : null)
                .latitud(incidencia.getLatitud())
                .longitud(incidencia.getLongitud())
                .direccionReferencia(incidencia.getDireccionReferencia())
                .fechaCreacion(incidencia.getFechaCreacion() != null ? incidencia.getFechaCreacion().toString() : null)
                .fechaActualizacion(incidencia.getFechaActualizacion() != null ? incidencia.getFechaActualizacion().toString() : null)
                .fechaResolucion(incidencia.getFechaResolucion() != null ? incidencia.getFechaResolucion().toString() : null)
                .multimedia(multimedia)
                .iaClasificado(incidencia.getIaClasificado())
                .iaCategoria(incidencia.getIaCategoria() != null ? incidencia.getIaCategoria().name() : null)
                .iaPrioridad(incidencia.getIaPrioridad() != null ? incidencia.getIaPrioridad().name() : null)
                .iaConfianza(incidencia.getIaConfianza())
                .iaResumen(incidencia.getIaResumen())
                .iaRazonRechazo(incidencia.getIaRazonRechazo())
                .build();
    }

    private IncidenciaMultimediaResponse convertMultimediaToDTO(IncidenciaMultimedia multimedia) {
        String url = s3Service.generarPresignedUrlDescarga(multimedia.getS3Key());
        return IncidenciaMultimediaResponse.builder()
                .id(multimedia.getId())
                .s3Key(multimedia.getS3Key())
                .nombreOriginal(multimedia.getNombreOriginal())
                .tipoContenido(multimedia.getTipoContenido())
                .tamanoBytes(multimedia.getTamanoBytes())
                .orden(multimedia.getOrden())
                .fechaSubida(multimedia.getFechaSubida() != null ? multimedia.getFechaSubida().toString() : null)
                .url(url)
                .build();
    }
}
