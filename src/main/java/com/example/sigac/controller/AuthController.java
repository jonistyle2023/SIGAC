package com.example.sigac.controller;

import com.example.sigac.dto.request.LoginRequest;
import com.example.sigac.dto.request.RegisterEntidadRequest;
import com.example.sigac.dto.request.RegisterRequest;
import com.example.sigac.dto.response.AuthResponse;
import com.example.sigac.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthService authService;

    /**
     * Registrar un nuevo ciudadano
     * Solo permite registro de ciudadanos (CIUDADANO role)
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegisterRequest request) {
        log.info("Recibida solicitud de registro para: {}", request.getEmail());
        AuthResponse response = authService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Login de usuario
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Recibida solicitud de login para: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Crear el primer administrador del sistema (solo funciona si no existe ningún admin).
     * Se auto-deshabilita una vez que hay al menos un administrador registrado.
     * POST /api/auth/bootstrap-admin
     */
    @PostMapping("/bootstrap-admin")
    public ResponseEntity<AuthResponse> bootstrapAdmin(@Valid @RequestBody RegisterRequest request) {
        log.info("Solicitud de bootstrap de primer administrador: {}", request.getEmail());
        AuthResponse response = authService.bootstrapAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Registrar un nuevo administrador (Solo accesible por administrador existente)
     * POST /api/auth/register-admin
     */
    @PostMapping("/register-admin")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<AuthResponse> registrarAdministrador(@Valid @RequestBody RegisterRequest request) {
        log.info("Registrando nuevo administrador: {}", request.getEmail());
        AuthResponse response = authService.registrarAdministrador(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Registrar una nueva entidad pública (Solo accesible por administrador)
     * POST /api/auth/register-entidad
     */
    @PostMapping("/register-entidad")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<AuthResponse> registrarEntidadPublica(@Valid @RequestBody RegisterEntidadRequest request) {
        log.info("Registrando nueva entidad pública: {}", request.getEmail());
        AuthResponse response = authService.registrarEntidadPublica(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Validar token JWT
     * POST /api/auth/validate-token
     */
    @PostMapping("/validate-token")
    public ResponseEntity<AuthResponse> validarToken(@RequestHeader("Authorization") String token) {
        log.info("Validando token");

        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                            .exito(false)
                            .mensaje("Token inválido")
                            .build());
        }

        return ResponseEntity.ok(AuthResponse.builder()
                .exito(true)
                .mensaje("Token válido")
                .build());
    }
}

