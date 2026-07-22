package com.example.sigac.controller;

import com.example.sigac.dto.response.NotificacionResponse;
import com.example.sigac.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<NotificacionResponse>> obtenerMisNotificaciones(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(notificacionService.obtenerMisNotificaciones(page, size));
    }

    @GetMapping("/no-leidas/contador")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> contarNoLeidas() {
        return ResponseEntity.ok(Map.of("noLeidas", notificacionService.contarNoLeidas()));
    }

    @PutMapping("/{id}/leer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> marcarLeida(@PathVariable Long id) {
        notificacionService.marcarLeida(id);
        return ResponseEntity.ok(Map.of("mensaje", "Notificación marcada como leída"));
    }

    @PutMapping("/leer-todas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> marcarTodasLeidas() {
        notificacionService.marcarTodasLeidas();
        return ResponseEntity.ok(Map.of("mensaje", "Notificaciones marcadas como leídas"));
    }
}
