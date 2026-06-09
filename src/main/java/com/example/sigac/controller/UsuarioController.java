package com.example.sigac.controller;

import com.example.sigac.dto.response.UsuarioResponse;
import com.example.sigac.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class UsuarioController {

    private final UsuarioService usuarioService;

    /**
     * Obtener el perfil del usuario autenticado
     * GET /api/usuarios/perfil
     */
    @GetMapping("/perfil")
    @PreAuthorize("hasAnyRole('CIUDADANO', 'ADMINISTRADOR', 'ENTIDAD_PUBLICA')")
    public ResponseEntity<UsuarioResponse> obtenerPerfil() {
        log.info("Obteniendo perfil del usuario autenticado");
        return ResponseEntity.ok(usuarioService.obtenerPerfil());
    }

    /**
     * Obtener usuario por ID (Solo administrador)
     * GET /api/usuarios/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> obtenerPorId(@PathVariable Long id) {
        log.info("Obteniendo usuario con ID: {}", id);
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    /**
     * Obtener usuario por email (Solo administrador)
     * GET /api/usuarios/email/{email}
     */
    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> obtenerPorEmail(@PathVariable String email) {
        log.info("Obteniendo usuario con email: {}", email);
        return ResponseEntity.ok(usuarioService.obtenerPorEmail(email));
    }

    /**
     * Obtener todos los usuarios (Solo administrador)
     * GET /api/usuarios
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<UsuarioResponse>> obtenerTodos() {
        log.info("Obteniendo todos los usuarios");
        return ResponseEntity.ok(usuarioService.obtenerTodos());
    }

    /**
     * Obtener todos los usuarios activos (Solo administrador)
     * GET /api/usuarios/activos
     */
    @GetMapping("/filtro/activos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<UsuarioResponse>> obtenerTodosActivos() {
        log.info("Obteniendo todos los usuarios activos");
        return ResponseEntity.ok(usuarioService.obtenerTodosActivos());
    }

    /**
     * Desactivar un usuario (Solo administrador)
     * PUT /api/usuarios/{id}/desactivar
     */
    @PutMapping("/{id}/desactivar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<String> desactivarUsuario(@PathVariable Long id) {
        log.info("Desactivando usuario: {}", id);
        usuarioService.desactivarUsuario(id);
        return ResponseEntity.ok("Usuario desactivado exitosamente");
    }

    /**
     * Activar un usuario (Solo administrador)
     * PUT /api/usuarios/{id}/activar
     */
    @PutMapping("/{id}/activar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<String> activarUsuario(@PathVariable Long id) {
        log.info("Activando usuario: {}", id);
        usuarioService.activarUsuario(id);
        return ResponseEntity.ok("Usuario activado exitosamente");
    }
}

