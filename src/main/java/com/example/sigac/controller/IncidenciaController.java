package com.example.sigac.controller;

import com.example.sigac.dto.request.*;
import com.example.sigac.dto.response.IncidenciaMultimediaResponse;
import com.example.sigac.dto.response.IncidenciaResponse;
import com.example.sigac.dto.response.PresignedUrlResponse;
import com.example.sigac.model.EstadoIncidencia;
import com.example.sigac.service.IncidenciaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/incidencias")
@RequiredArgsConstructor
public class IncidenciaController {

    private final IncidenciaService incidenciaService;

    // ─── Crear (ciudadano) ────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('CIUDADANO')")
    public ResponseEntity<IncidenciaResponse> crear(@Valid @RequestBody CreateIncidenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidenciaService.crear(request));
    }

    // ─── Lectura ──────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'ENTIDAD_PUBLICA')")
    public ResponseEntity<Page<IncidenciaResponse>> obtenerTodas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) EstadoIncidencia estado) {
        return ResponseEntity.ok(incidenciaService.obtenerTodas(page, size, estado));
    }

    @GetMapping("/mis-incidencias")
    @PreAuthorize("hasRole('CIUDADANO')")
    public ResponseEntity<Page<IncidenciaResponse>> obtenerMisIncidencias(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) EstadoIncidencia estado) {
        return ResponseEntity.ok(incidenciaService.obtenerMisIncidencias(page, size, estado));
    }

    @GetMapping("/asignadas")
    @PreAuthorize("hasRole('ENTIDAD_PUBLICA')")
    public ResponseEntity<Page<IncidenciaResponse>> obtenerAsignadas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) EstadoIncidencia estado) {
        return ResponseEntity.ok(incidenciaService.obtenerPorEntidad(page, size, estado));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IncidenciaResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(incidenciaService.obtenerPorId(id));
    }

    // ─── Actualización ────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CIUDADANO', 'ADMINISTRADOR')")
    public ResponseEntity<IncidenciaResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidenciaRequest request) {
        return ResponseEntity.ok(incidenciaService.actualizar(id, request));
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'ENTIDAD_PUBLICA')")
    public ResponseEntity<IncidenciaResponse> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoRequest request) {
        return ResponseEntity.ok(incidenciaService.cambiarEstado(id, request));
    }

    @PutMapping("/{id}/asignar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<IncidenciaResponse> asignar(
            @PathVariable Long id,
            @Valid @RequestBody AsignarIncidenciaRequest request) {
        return ResponseEntity.ok(incidenciaService.asignar(id, request));
    }

    // ─── Eliminar ─────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CIUDADANO', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable Long id) {
        incidenciaService.eliminar(id);
        return ResponseEntity.ok(Map.of("mensaje", "Incidencia eliminada correctamente"));
    }

    // ─── Multimedia ───────────────────────────────────────────────────────────

    @PostMapping("/{id}/multimedia/presigned-url")
    @PreAuthorize("hasRole('CIUDADANO')")
    public ResponseEntity<PresignedUrlResponse> generarUrlSubida(
            @PathVariable Long id,
            @Valid @RequestBody PresignedUrlRequest request) {
        return ResponseEntity.ok(incidenciaService.generarUrlSubida(id, request));
    }

    @PostMapping("/{id}/multimedia")
    @PreAuthorize("hasRole('CIUDADANO')")
    public ResponseEntity<IncidenciaMultimediaResponse> confirmarSubida(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmarMultimediaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidenciaService.confirmarSubida(id, request));
    }

    @DeleteMapping("/{id}/multimedia/{multimediaId}")
    @PreAuthorize("hasAnyRole('CIUDADANO', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> eliminarMultimedia(
            @PathVariable Long id,
            @PathVariable Long multimediaId) {
        incidenciaService.eliminarMultimedia(id, multimediaId);
        return ResponseEntity.ok(Map.of("mensaje", "Archivo eliminado correctamente"));
    }
}
