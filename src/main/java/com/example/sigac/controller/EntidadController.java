package com.example.sigac.controller;

import com.example.sigac.dto.request.CreateEntidadRequest;
import com.example.sigac.dto.request.UpdateEntidadRequest;
import com.example.sigac.dto.response.EntidadResponse;
import com.example.sigac.service.EntidadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entidades")
@RequiredArgsConstructor
public class EntidadController {

    private final EntidadService entidadService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<EntidadResponse>> obtenerTodas() {
        return ResponseEntity.ok(entidadService.obtenerTodas());
    }

    @GetMapping("/activas")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'ENTIDAD_PUBLICA')")
    public ResponseEntity<List<EntidadResponse>> obtenerActivas() {
        return ResponseEntity.ok(entidadService.obtenerActivas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'ENTIDAD_PUBLICA')")
    public ResponseEntity<EntidadResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(entidadService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EntidadResponse> crear(@Valid @RequestBody CreateEntidadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entidadService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EntidadResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEntidadRequest request) {
        return ResponseEntity.ok(entidadService.actualizar(id, request));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EntidadResponse> toggleActivo(@PathVariable Long id) {
        return ResponseEntity.ok(entidadService.toggleActivo(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable Long id) {
        entidadService.eliminar(id);
        return ResponseEntity.ok(Map.of("mensaje", "Entidad eliminada correctamente"));
    }
}
