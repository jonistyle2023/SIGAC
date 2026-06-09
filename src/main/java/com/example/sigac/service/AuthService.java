package com.example.sigac.service;

import com.example.sigac.dto.request.LoginRequest;
import com.example.sigac.dto.request.RegisterRequest;
import com.example.sigac.dto.response.AuthResponse;
import com.example.sigac.exception.BadRequestException;
import com.example.sigac.exception.UnauthorizedException;
import com.example.sigac.model.Role;
import com.example.sigac.model.Usuario;
import com.example.sigac.repository.UsuarioRepository;
import com.example.sigac.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    private static final int MAX_ADMINISTRADORES = 3;

    @Transactional
    public AuthResponse registrar(RegisterRequest request) {
        log.info("Registrando nuevo usuario con email: {}", request.getEmail());

        // Validar que las contraseñas coincidan
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Las contraseñas no coinciden");
        }

        // Validar que el email no exista
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El email ya está registrado");
        }

        // Validar que la cédula no exista
        if (usuarioRepository.existsByCedula(request.getCedula())) {
            throw new BadRequestException("La cédula ya está registrada");
        }

        // Los ciudadanos se registran a sí mismos
        Usuario usuario = Usuario.builder()
                .cedula(request.getCedula())
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Role.CIUDADANO)  // Solo ciudadanos pueden auto-registrarse
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .activo(true)
                .emailVerificado(false)
                .build();

        Usuario usuarioGuardado = usuarioRepository.save(usuario);
        log.info("Usuario registrado exitosamente: {}", usuarioGuardado.getEmail());

        // Generar token
        String token = jwtTokenProvider.generateToken(usuarioGuardado.getEmail(), Role.CIUDADANO.name());

        return AuthResponse.builder()
                .token(token)
                .id(usuarioGuardado.getId())
                .email(usuarioGuardado.getEmail())
                .nombre(usuarioGuardado.getNombre())
                .rol(usuarioGuardado.getRol().name())
                .exito(true)
                .mensaje("Usuario registrado exitosamente")
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Intentando login para usuario: {}", request.getEmail());

        // Autenticar
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            // Obtener usuario
            Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));

            if (!usuario.getActivo()) {
                throw new BadRequestException("El usuario está desactivado");
            }

            // Actualizar último acceso
            usuario.setUltimoAcceso(LocalDateTime.now());
            usuarioRepository.save(usuario);

            // Generar token
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

        // Validar límite de administradores
        long countAdmins = usuarioRepository.countByRol(Role.ADMINISTRADOR);
        if (countAdmins >= MAX_ADMINISTRADORES) {
            throw new BadRequestException("Se ha alcanzado el máximo número de administradores (3)");
        }

        // Validar que las contraseñas coincidan
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Las contraseñas no coinciden");
        }

        // Validar que el email no exista
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El email ya está registrado");
        }

        // Validar que la cédula no exista
        if (usuarioRepository.existsByCedula(request.getCedula())) {
            throw new BadRequestException("La cédula ya está registrada");
        }

        Usuario usuario = Usuario.builder()
                .cedula(request.getCedula())
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Role.ADMINISTRADOR)
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .activo(true)
                .emailVerificado(true) // Los administradores se activan directamente
                .build();

        Usuario usuarioGuardado = usuarioRepository.save(usuario);
        log.info("Administrador registrado exitosamente: {}", usuarioGuardado.getEmail());

        return AuthResponse.builder()
                .id(usuarioGuardado.getId())
                .email(usuarioGuardado.getEmail())
                .nombre(usuarioGuardado.getNombre())
                .rol(usuarioGuardado.getRol().name())
                .exito(true)
                .mensaje("Administrador registrado exitosamente")
                .build();
    }

    @Transactional
    public AuthResponse registrarEntidadPublica(RegisterRequest request) {
        log.info("Registrando nueva entidad pública con email: {}", request.getEmail());

        // Validar que el email no exista
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El email ya está registrado");
        }

        // Las entidades públicas pueden no tener cédula (es opcional)
        if (request.getCedula() != null && !request.getCedula().isBlank() && usuarioRepository.existsByCedula(request.getCedula())) {
            throw new BadRequestException("La cédula ya está registrada");
        }

        Usuario usuario = Usuario.builder()
                .cedula(request.getCedula())
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Role.ENTIDAD_PUBLICA)
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .activo(true)
                .emailVerificado(true)
                .build();

        Usuario usuarioGuardado = usuarioRepository.save(usuario);
        log.info("Entidad pública registrada exitosamente: {}", usuarioGuardado.getEmail());

        return AuthResponse.builder()
                .id(usuarioGuardado.getId())
                .email(usuarioGuardado.getEmail())
                .nombre(usuarioGuardado.getNombre())
                .rol(usuarioGuardado.getRol().name())
                .exito(true)
                .mensaje("Entidad pública registrada exitosamente")
                .build();
    }

    public boolean esAdministrador(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
        return usuario.getRol() == Role.ADMINISTRADOR;
    }

    public boolean esCiudadano(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
        return usuario.getRol() == Role.CIUDADANO;
    }

    public boolean esEntidadPublica(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
        return usuario.getRol() == Role.ENTIDAD_PUBLICA;
    }
}

