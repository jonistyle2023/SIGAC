package com.example.sigac.audit;

import com.example.sigac.dto.response.AuditLogResponse;
import com.example.sigac.exception.BadRequestException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditRepository auditRepository;

    // ─── Escritura ────────────────────────────────────────────────────────────

    public void log(AuditAction action, String resource, Long resourceId,
                    String previousValue, String newValue,
                    Long actorId, String actorEmail, String actorRole) {
        try {
            String ipAddress = null;
            String userAgent = null;
            try {
                HttpServletRequest request = ((ServletRequestAttributes)
                        RequestContextHolder.currentRequestAttributes()).getRequest();
                ipAddress = request.getRemoteAddr();
                userAgent = request.getHeader("User-Agent");
            } catch (IllegalStateException ignored) {
                // Fuera de contexto HTTP (tareas asíncronas, etc.)
            }

            AuditLog entry = AuditLog.builder()
                    .action(action)
                    .resource(resource)
                    .resourceId(resourceId)
                    .previousValue(previousValue)
                    .newValue(newValue)
                    .userId(actorId)
                    .userEmail(actorEmail)
                    .userRole(actorRole)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            auditRepository.save(entry);
            log.debug("Auditoría: {} | recurso={} id={} | actor={}", action, resource, resourceId, actorEmail);
        } catch (Exception e) {
            // Un fallo en auditoría nunca debe interrumpir la operación de negocio
            log.error("Error al registrar auditoría [{}]: {}", action, e.getMessage());
        }
    }

    public void log(AuditAction action, String resource, Long resourceId,
                    Long actorId, String actorEmail, String actorRole) {
        log(action, resource, resourceId, null, null, actorId, actorEmail, actorRole);
    }

    // ─── Consultas (solo lectura) ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> obtenerTodos(int page, int size) {
        return auditRepository.findAllByOrderByTimestampDesc(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> obtenerPorUsuario(Long userId) {
        return auditRepository.findByUserIdOrderByTimestampDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> obtenerPorAccion(String actionStr) {
        AuditAction action;
        try {
            action = AuditAction.valueOf(actionStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Acción inválida: " + actionStr);
        }
        return auditRepository.findByActionOrderByTimestampDesc(action)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> obtenerPorRecurso(String resource, Long resourceId) {
        return auditRepository.findByResourceAndResourceIdOrderByTimestampDesc(resource, resourceId)
                .stream().map(this::toResponse).toList();
    }

    // ─── Conversión ───────────────────────────────────────────────────────────

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .timestamp(log.getTimestamp().toString())
                .userId(log.getUserId())
                .userEmail(log.getUserEmail())
                .userRole(log.getUserRole())
                .action(log.getAction().name())
                .resource(log.getResource())
                .resourceId(log.getResourceId())
                .previousValue(log.getPreviousValue())
                .newValue(log.getNewValue())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .metadata(log.getMetadata())
                .build();
    }
}