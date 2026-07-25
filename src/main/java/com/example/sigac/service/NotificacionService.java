package com.example.sigac.service;

import com.example.sigac.dto.response.NotificacionResponse;
import com.example.sigac.event.IncidenciaAsignadaEvent;
import com.example.sigac.event.IncidenciaEstadoCambiadoEvent;
import com.example.sigac.exception.ResourceNotFoundException;
import com.example.sigac.exception.UnauthorizedException;
import com.example.sigac.model.Notificacion;
import com.example.sigac.model.TipoNotificacion;
import com.example.sigac.model.Usuario;
import com.example.sigac.repository.IncidenciaRepository;
import com.example.sigac.repository.NotificacionRepository;
import com.example.sigac.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final IncidenciaRepository incidenciaRepository;

    // ─── Generación (listeners de eventos de dominio) ────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("notificacionExecutor")
    public void onEstadoCambiado(IncidenciaEstadoCambiadoEvent event) {
        try {
            Usuario ciudadano = usuarioRepository.findById(event.ciudadanoId()).orElse(null);
            if (ciudadano == null) return;

            Notificacion notificacion = Notificacion.builder()
                    .usuario(ciudadano)
                    .tipo(TipoNotificacion.CAMBIO_ESTADO)
                    .titulo("Cambio de estado")
                    .mensaje("Tu incidencia \"" + tituloODefault(event.titulo(), event.incidenciaId()) + "\" cambió de "
                            + event.estadoAnterior() + " a " + event.estadoNuevo() + ".")
                    .incidencia(incidenciaRepository.getReferenceById(event.incidenciaId()))
                    .build();

            notificacionRepository.save(notificacion);
            log.info("Notificación de cambio de estado creada para usuario {} (incidencia {})",
                    ciudadano.getId(), event.incidenciaId());
        } catch (Exception e) {
            log.error("Error al generar notificación de cambio de estado, incidencia {}: {}",
                    event.incidenciaId(), e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("notificacionExecutor")
    public void onIncidenciaAsignada(IncidenciaAsignadaEvent event) {
        try {
            var destinatarios = usuarioRepository.findByEntidadIdAndActivoTrue(event.entidadId());
            var incidenciaRef = incidenciaRepository.getReferenceById(event.incidenciaId());

            for (Usuario destinatario : destinatarios) {
                Notificacion notificacion = Notificacion.builder()
                        .usuario(destinatario)
                        .tipo(TipoNotificacion.ASIGNACION)
                        .titulo("Nueva incidencia asignada")
                        .mensaje("La incidencia \"" + tituloODefault(event.titulo(), event.incidenciaId())
                                + "\" fue asignada a " + event.entidadNombre() + ".")
                        .incidencia(incidenciaRef)
                        .build();
                notificacionRepository.save(notificacion);
            }
            log.info("Notificación de asignación creada para {} usuario(s) de entidad {} (incidencia {})",
                    destinatarios.size(), event.entidadId(), event.incidenciaId());
        } catch (Exception e) {
            log.error("Error al generar notificación de asignación, incidencia {}: {}",
                    event.incidenciaId(), e.getMessage());
        }
    }

    // La incidencia puede no tener título todavía (foto sin clasificar por IA).
    private String tituloODefault(String titulo, Long incidenciaId) {
        return (titulo != null && !titulo.isBlank()) ? titulo : "Reporte #" + incidenciaId;
    }

    // ─── Consultas y acciones del usuario autenticado ────────────────────────

    @Transactional(readOnly = true)
    public Page<NotificacionResponse> obtenerMisNotificaciones(int page, int size) {
        Usuario usuario = obtenerUsuarioAutenticado();
        return notificacionRepository
                .findByUsuarioIdOrderByFechaCreacionDesc(usuario.getId(), PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas() {
        Usuario usuario = obtenerUsuarioAutenticado();
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuario.getId());
    }

    @Transactional
    public void marcarLeida(Long id) {
        Usuario usuario = obtenerUsuarioAutenticado();
        Notificacion notificacion = notificacionRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada"));

        if (!notificacion.getLeida()) {
            notificacion.setLeida(true);
            notificacion.setFechaLectura(LocalDateTime.now());
            notificacionRepository.save(notificacion);
        }
    }

    @Transactional
    public void marcarTodasLeidas() {
        Usuario usuario = obtenerUsuarioAutenticado();
        notificacionRepository.marcarTodasComoLeidas(usuario.getId(), LocalDateTime.now());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Usuario no autenticado");
        }
        return usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private NotificacionResponse toResponse(Notificacion notificacion) {
        return NotificacionResponse.builder()
                .id(notificacion.getId())
                .tipo(notificacion.getTipo().name())
                .titulo(notificacion.getTitulo())
                .mensaje(notificacion.getMensaje())
                .incidenciaId(notificacion.getIncidencia() != null ? notificacion.getIncidencia().getId() : null)
                .leida(notificacion.getLeida())
                .fechaCreacion(notificacion.getFechaCreacion() != null ? notificacion.getFechaCreacion().toString() : null)
                .fechaLectura(notificacion.getFechaLectura() != null ? notificacion.getFechaLectura().toString() : null)
                .build();
    }
}
