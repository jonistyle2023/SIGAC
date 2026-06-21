package com.example.sigac.service;

import com.example.sigac.audit.AuditAction;
import com.example.sigac.audit.AuditService;
import com.example.sigac.dto.request.CreateEntidadRequest;
import com.example.sigac.dto.request.UpdateEntidadRequest;
import com.example.sigac.dto.response.EntidadResponse;
import com.example.sigac.exception.BadRequestException;
import com.example.sigac.exception.ResourceNotFoundException;
import com.example.sigac.exception.UnauthorizedException;
import com.example.sigac.model.Entidad;
import com.example.sigac.model.Usuario;
import com.example.sigac.repository.EntidadRepository;
import com.example.sigac.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EntidadService {

    private final EntidadRepository entidadRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<EntidadResponse> obtenerTodas() {
        return entidadRepository.findAllByOrderByNombreAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EntidadResponse> obtenerActivas() {
        return entidadRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public EntidadResponse obtenerPorId(Long id) {
        return toDTO(obtenerOFail(id));
    }

    @Transactional
    public EntidadResponse crear(CreateEntidadRequest request) {
        if (entidadRepository.existsByNombreIgnoreCase(request.getNombre())) {
            throw new BadRequestException("Ya existe una entidad con ese nombre");
        }

        Entidad entidad = Entidad.builder()
                .nombre(request.getNombre())
                .tipo(request.getTipo())
                .descripcion(request.getDescripcion())
                .telefono(request.getTelefono())
                .emailContacto(request.getEmailContacto())
                .build();

        Entidad guardada = entidadRepository.save(entidad);
        Usuario actor = obtenerActor();

        auditService.log(AuditAction.ENTITY_CREATE, "entidad", guardada.getId(),
                null, guardada.getNombre(),
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Entidad {} creada por {}", guardada.getNombre(), actor.getEmail());
        return toDTO(guardada);
    }

    @Transactional
    public EntidadResponse actualizar(Long id, UpdateEntidadRequest request) {
        Entidad entidad = obtenerOFail(id);
        String nombrePrevio = entidad.getNombre();

        if (request.getNombre() != null && !request.getNombre().isBlank()) {
            if (!request.getNombre().equalsIgnoreCase(entidad.getNombre())
                    && entidadRepository.existsByNombreIgnoreCase(request.getNombre())) {
                throw new BadRequestException("Ya existe una entidad con ese nombre");
            }
            entidad.setNombre(request.getNombre());
        }
        if (request.getTipo() != null)            entidad.setTipo(request.getTipo());
        if (request.getDescripcion() != null)     entidad.setDescripcion(request.getDescripcion());
        if (request.getTelefono() != null)        entidad.setTelefono(request.getTelefono());
        if (request.getEmailContacto() != null)   entidad.setEmailContacto(request.getEmailContacto());

        Entidad guardada = entidadRepository.save(entidad);
        Usuario actor = obtenerActor();

        auditService.log(AuditAction.ENTITY_UPDATE, "entidad", guardada.getId(),
                nombrePrevio, guardada.getNombre(),
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Entidad {} actualizada por {}", guardada.getNombre(), actor.getEmail());
        return toDTO(guardada);
    }

    @Transactional
    public EntidadResponse toggleActivo(Long id) {
        Entidad entidad = obtenerOFail(id);
        boolean estadoPrevio = entidad.getActivo();
        entidad.setActivo(!estadoPrevio);
        Entidad guardada = entidadRepository.save(entidad);
        Usuario actor = obtenerActor();

        auditService.log(AuditAction.ENTITY_TOGGLE, "entidad", guardada.getId(),
                String.valueOf(estadoPrevio), String.valueOf(guardada.getActivo()),
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Entidad {} {} por {}", guardada.getNombre(),
                guardada.getActivo() ? "activada" : "desactivada", actor.getEmail());
        return toDTO(guardada);
    }

    @Transactional
    public void eliminar(Long id) {
        Entidad entidad = obtenerOFail(id);
        long funcionarios = entidadRepository.countFuncionariosByEntidadId(id);
        if (funcionarios > 0) {
            throw new BadRequestException(
                    "No se puede eliminar la entidad: tiene " + funcionarios + " funcionario(s) asociado(s)");
        }

        Usuario actor = obtenerActor();
        auditService.log(AuditAction.ENTITY_DELETE, "entidad", id,
                entidad.getNombre(), null,
                actor.getId(), actor.getEmail(), actor.getRol().name());

        entidadRepository.delete(entidad);
        log.info("Entidad {} eliminada por {}", entidad.getNombre(), actor.getEmail());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Entidad obtenerOFail(Long id) {
        return entidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entidad no encontrada con id: " + id));
    }

    private Usuario obtenerActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Usuario no autenticado");
        }
        return usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private EntidadResponse toDTO(Entidad entidad) {
        return EntidadResponse.builder()
                .id(entidad.getId())
                .nombre(entidad.getNombre())
                .tipo(entidad.getTipo().name())
                .descripcion(entidad.getDescripcion())
                .telefono(entidad.getTelefono())
                .emailContacto(entidad.getEmailContacto())
                .activo(entidad.getActivo())
                .fechaCreacion(entidad.getFechaCreacion() != null ? entidad.getFechaCreacion().toString() : null)
                .totalFuncionarios(entidadRepository.countFuncionariosByEntidadId(entidad.getId()))
                .build();
    }
}
