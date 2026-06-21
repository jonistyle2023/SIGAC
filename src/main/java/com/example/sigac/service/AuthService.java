package com.example.sigac.service;

import com.example.sigac.audit.AuditAction;
import com.example.sigac.audit.AuditService;
import com.example.sigac.dto.request.LoginRequest;
import com.example.sigac.dto.request.RegisterEntidadRequest;
import com.example.sigac.dto.request.RegisterRequest;
import com.example.sigac.dto.response.AuthResponse;
import com.example.sigac.exception.BadRequestException;
import com.example.sigac.exception.ResourceNotFoundException;
import com.example.sigac.exception.UnauthorizedException;
import com.example.sigac.model.Entidad;
import com.example.sigac.model.Role;
import com.example.sigac.model.Usuario;
import com.example.sigac.repository.EntidadRepository;
import com.example.sigac.repository.UsuarioRepository;
import com.example.sigac.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final EntidadRepository entidadRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;

    private static final int MAX_ADMINISTRADORES = 3;

    @Transactional
    public AuthResponse registrar(RegisterRequest request) {
        log.info("Registrando nuevo usuario con email: {}", request.getEmail());

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Las contraseñas no coinciden");
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El email ya está registrado");
        }
        if (usuarioRepository.existsByCedula(request.getCedula())) {
            throw new BadRequestException("La cédula ya está registrada");
        }

        Usuario usuario = Usuario.builder()
                .cedula(request.getCedula())
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Role.CIUDADANO)
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .activo(true)
                .emailVerificado(false)
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        log.info("Usuario registrado exitosamente: {}", guardado.getEmail());

        auditService.log(AuditAction.REGISTER_CIUDADANO, "usuario", guardado.getId(),
                null, guardado.getEmail(),
                guardado.getId(), guardado.getEmail(), guardado.getRol().name());

        String token = jwtTokenProvider.generateToken(guardado.getEmail(), Role.CIUDADANO.name());

        return AuthResponse.builder()
                .token(token)
                .id(guardado.getId())
                .email(guardado.getEmail())
                .nombre(guardado.getNombre())
                .rol(guardado.getRol().name())
                .exito(true)
                .mensaje("Usuario registrado exitosamente")
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Intentando login para usuario: {}", request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));

            if (!usuario.getActivo()) {
                throw new BadRequestException("El usuario está desactivado");
            }

            usuario.setUltimoAcceso(LocalDateTime.now());
            usuarioRepository.save(usuario);

            auditService.log(AuditAction.LOGIN, "usuario", usuario.getId(),
                    usuario.getId(), usuario.getEmail(), usuario.getRol().name());

            String token = jwtTokenProvider.generateToken(authentication);
            log.info("Login exitoso para usuario: {}", usuario.getEmail());

            return AuthResponse.builder()
                    .token(token)
                    .id(usuario.getId())
                    .email(usuario.getEmail())
                    .nombre(usuario.getNombre())
                    .rol(usuario.getRol().name())
                    .exito(true)
                    .mensaje("Login exitoso")
                    .build();

        } catch (org.springframework.security.core.AuthenticationException e) {
            log.error("Fallo en autenticación: {}", e.getMessage());
            throw new UnauthorizedException("Credenciales inválidas");
        }
    }

    @Transactional
    public AuthResponse registrarAdministrador(RegisterRequest request) {
        log.info("Registrando nuevo administrador con email: {}", request.getEmail());

        long countAdmins = usuarioRepository.countByRol(Role.ADMINISTRADOR);
        if (countAdmins >= MAX_ADMINISTRADORES) {
            throw new BadRequestException("Se ha alcanzado el máximo número de administradores (" + MAX_ADMINISTRADORES + ")");
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Las contraseñas no coinciden");
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El email ya está registrado");
        }
        if (usuarioRepository.existsByCedula(request.getCedula())) {
            throw new BadRequestException("La cédula ya está registrada");
        }

        Usuario guardado = usuarioRepository.save(Usuario.builder()
                .cedula(request.getCedula())
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Role.ADMINISTRADOR)
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .activo(true)
                .emailVerificado(true)
                .build());

        log.info("Administrador registrado exitosamente: {}", guardado.getEmail());

        String actorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        usuarioRepository.findByEmail(actorEmail).ifPresent(actor ->
                auditService.log(AuditAction.REGISTER_ADMINISTRADOR, "usuario", guardado.getId(),
                        null, guardado.getEmail(),
                        actor.getId(), actor.getEmail(), actor.getRol().name())
        );

        return AuthResponse.builder()
                .id(guardado.getId())
                .email(guardado.getEmail())
                .nombre(guardado.getNombre())
                .rol(guardado.getRol().name())
                .exito(true)
                .mensaje("Administrador registrado exitosamente")
                .build();
    }

    @Transactional
    public AuthResponse registrarEntidadPublica(RegisterEntidadRequest request) {
        log.info("Registrando nueva entidad pública con email: {}", request.getEmail());

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Las contraseñas no coinciden");
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El email ya está registrado");
        }

        String cedula = (request.getCedula() != null && !request.getCedula().isBlank())
                ? request.getCedula() : null;

        if (cedula != null && usuarioRepository.existsByCedula(cedula)) {
            throw new BadRequestException("La cédula/RUC ya está registrado");
        }

        Entidad entidad = entidadRepository.findById(request.getEntidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Entidad no encontrada"));
        if (!entidad.getActivo()) {
            throw new BadRequestException("La entidad seleccionada está inactiva");
        }

        Usuario guardado = usuarioRepository.save(Usuario.builder()
                .cedula(cedula)
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Role.ENTIDAD_PUBLICA)
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .entidad(entidad)
                .activo(true)
                .emailVerificado(true)
                .build());

        log.info("Entidad pública registrada exitosamente: {}", guardado.getEmail());

        String actorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        usuarioRepository.findByEmail(actorEmail).ifPresent(actor ->
                auditService.log(AuditAction.REGISTER_ENTIDAD_PUBLICA, "usuario", guardado.getId(),
                        null, guardado.getEmail(),
                        actor.getId(), actor.getEmail(), actor.getRol().name())
        );

        return AuthResponse.builder()
                .id(guardado.getId())
                .email(guardado.getEmail())
                .nombre(guardado.getNombre())
                .rol(guardado.getRol().name())
                .exito(true)
                .mensaje("Entidad pública registrada exitosamente")
                .build();
    }

    public boolean esAdministrador(String email) {
        return usuarioRepository.findByEmail(email)
                .map(u -> u.getRol() == Role.ADMINISTRADOR)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
    }

    public boolean esCiudadano(String email) {
        return usuarioRepository.findByEmail(email)
                .map(u -> u.getRol() == Role.CIUDADANO)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
    }

    public boolean esEntidadPublica(String email) {
        return usuarioRepository.findByEmail(email)
                .map(u -> u.getRol() == Role.ENTIDAD_PUBLICA)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
    }
}