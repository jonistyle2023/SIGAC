package com.example.sigac.controller;

import com.example.sigac.dto.request.ChangePasswordRequest;
import com.example.sigac.dto.request.UpdateProfileRequest;
import com.example.sigac.dto.response.UsuarioResponse;
import com.example.sigac.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Slf4j
public class UsuarioController {

    private final UsuarioService usuarioService;

    // ─── Endpoints propios (cualquier usuario autenticado) ───────────────────

    @GetMapping("/perfil")
    @PreAuthorize("hasAnyRole('CIUDADANO', 'ADMINISTRADOR', 'ENTIDAD_PUBLICA')")
    public ResponseEntity<UsuarioResponse> obtenerPerfil() {
        return ResponseEntity.ok(usuarioService.obtenerPerfil());
    }

    @PutMapping("/perfil")
    @PreAuthorize("hasAnyRole('CIUDADANO', 'ADMINISTRADOR', 'ENTIDAD_PUBLICA')")
    public ResponseEntity<UsuarioResponse> actualizarPerfil(@Valid @RequestBody UpdateProfileRequest request) {
        log.info("Actualizando perfil del usuario autenticado");
        return ResponseEntity.ok(usuarioService.actualizarPerfil(request));
    }

    @PutMapping("/perfil/password")
    @PreAuthorize("hasAnyRole('CIUDADANO', 'ADMINISTRADOR', 'ENTIDAD_PUBLICA')")
    public ResponseEntity<Map<String, String>> cambiarPassword(@Valid @RequestBody ChangePasswordRequest request) {
        log.info("Cambiando contraseña del usuario autenticado");
        usuarioService.cambiarPassword(request);
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada exitosamente"));
    }

    // ─── Endpoints de administración (solo ADMINISTRADOR) ────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<UsuarioResponse>> obtenerTodos() {
        return ResponseEntity.ok(usuarioService.obtenerTodos());
    }

    @GetMapping("/filtro/activos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<UsuarioResponse>> obtenerTodosActivos() {
        return ResponseEntity.ok(usuarioService.obtenerTodosActivos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> obtenerPorEmail(@PathVariable String email) {
        return ResponseEntity.ok(usuarioService.obtenerPorEmail(email));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> actualizarUsuario(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request) {
        log.info("Administrador actualizando usuario con ID: {}", id);
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, request));
    }

    @PutMapping("/{id}/rol")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> cambiarRol(
            @PathVariable Long id,
            @RequestParam String nuevoRol) {
        log.info("Cambiando rol del usuario {} a {}", id, nuevoRol);
        return ResponseEntity.ok(usuarioService.cambiarRol(id, nuevoRol));
    }

    @PutMapping("/{id}/activar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> activarUsuario(@PathVariable Long id) {
        usuarioService.activarUsuario(id);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario activado exitosamente"));
    }

    @PutMapping("/{id}/desactivar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> desactivarUsuario(@PathVariable Long id) {
        usuarioService.desactivarUsuario(id);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario desactivado exitosamente"));
    }
}