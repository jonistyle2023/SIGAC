package com.example.sigac.audit;

import com.example.sigac.dto.response.AuditLogResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Slf4j
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Page<AuditLogResponse>> obtenerTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(auditService.obtenerTodos(page, size));
    }

    @GetMapping("/usuario/{userId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<AuditLogResponse>> obtenerPorUsuario(@PathVariable Long userId) {
        return ResponseEntity.ok(auditService.obtenerPorUsuario(userId));
    }

    @GetMapping("/accion/{action}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<AuditLogResponse>> obtenerPorAccion(@PathVariable String action) {
        return ResponseEntity.ok(auditService.obtenerPorAccion(action));
    }

    @GetMapping("/recurso/{resource}/{resourceId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<AuditLogResponse>> obtenerPorRecurso(
            @PathVariable String resource,
            @PathVariable Long resourceId) {
        return ResponseEntity.ok(auditService.obtenerPorRecurso(resource, resourceId));
    }
}