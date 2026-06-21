package com.example.sigac.service;

import com.example.sigac.audit.AuditAction;
import com.example.sigac.audit.AuditService;
import com.example.sigac.dto.request.ChangePasswordRequest;
import com.example.sigac.dto.request.UpdateProfileRequest;
import com.example.sigac.dto.response.UsuarioResponse;
import com.example.sigac.exception.BadRequestException;
import com.example.sigac.exception.ResourceNotFoundException;
import com.example.sigac.exception.UnauthorizedException;
import com.example.sigac.model.Role;
import com.example.sigac.model.Usuario;
import com.example.sigac.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    private static final int MAX_ADMINISTRADORES = 3;

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPerfil() {
        return convertToDTO(obtenerUsuarioAutenticado());
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorId(Long id) {
        return convertToDTO(usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado")));
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorEmail(String email) {
        return convertToDTO(usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado")));
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerTodos() {
        return usuarioRepository.findAll().stream().map(this::convertToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerTodosActivos() {
        return usuarioRepository.findAllActivos().stream().map(this::convertToDTO).toList();
    }

    @Transactional
    public UsuarioResponse actualizarPerfil(UpdateProfileRequest request) {
        Usuario usuario = obtenerUsuarioAutenticado();

        String prevNombre = usuario.getNombre();
        String prevApellido = usuario.getApellido();

        aplicarCambiosPerfil(usuario, request);
        Usuario guardado = usuarioRepository.save(usuario);

        auditService.log(AuditAction.USER_UPDATE, "usuario", guardado.getId(),
                "nombre=" + prevNombre + ", apellido=" + prevApellido,
                "nombre=" + guardado.getNombre() + ", apellido=" + guardado.getApellido(),
                guardado.getId(), guardado.getEmail(), guardado.getRol().name());

        log.info("Perfil actualizado para usuario: {}", guardado.getEmail());
        return convertToDTO(guardado);
    }

    @Transactional
    public UsuarioResponse actualizarUsuario(Long id, UpdateProfileRequest request) {
        Usuario actor = obtenerUsuarioAutenticado();
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        String prevNombre = usuario.getNombre();
        String prevApellido = usuario.getApellido();

        aplicarCambiosPerfil(usuario, request);
        Usuario guardado = usuarioRepository.save(usuario);

        auditService.log(AuditAction.USER_UPDATE, "usuario", guardado.getId(),
                "nombre=" + prevNombre + ", apellido=" + prevApellido,
                "nombre=" + guardado.getNombre() + ", apellido=" + guardado.getApellido(),
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Usuario {} actualizado por {}", guardado.getEmail(), actor.getEmail());
        return convertToDTO(guardado);
    }

    @Transactional
    public void cambiarPassword(ChangePasswordRequest request) {
        if (!request.getPasswordNueva().equals(request.getConfirmPasswordNueva())) {
            throw new BadRequestException("Las contraseñas no coinciden");
        }

        Usuario usuario = obtenerUsuarioAutenticado();

        if (!passwordEncoder.matches(request.getPasswordActual(), usuario.getPassword())) {
            throw new BadRequestException("La contraseña actual es incorrecta");
        }

        usuario.setPassword(passwordEncoder.encode(request.getPasswordNueva()));
        usuarioRepository.save(usuario);

        auditService.log(AuditAction.PASSWORD_CHANGE, "usuario", usuario.getId(),
                usuario.getId(), usuario.getEmail(), usuario.getRol().name());

        log.info("Contraseña actualizada para usuario: {}", usuario.getEmail());
    }

    @Transactional
    public UsuarioResponse cambiarRol(Long id, String nuevoRolStr) {
        Role nuevoRol;
        try {
            nuevoRol = Role.valueOf(nuevoRolStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Rol inválido. Los roles permitidos son: CIUDADANO, ADMINISTRADOR, ENTIDAD_PUBLICA");
        }

        Usuario actor = obtenerUsuarioAutenticado();
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Role rolActual = usuario.getRol();
        if (rolActual == nuevoRol) {
            throw new BadRequestException("El usuario ya tiene el rol " + nuevoRol.name());
        }

        if (rolActual == Role.ADMINISTRADOR) {
            long adminActivos = usuarioRepository.findActivosByRol(Role.ADMINISTRADOR).size();
            if (adminActivos <= 1) {
                throw new BadRequestException("No se puede cambiar el rol del único administrador activo");
            }
        }

        if (nuevoRol == Role.ADMINISTRADOR) {
            long totalAdmins = usuarioRepository.countByRol(Role.ADMINISTRADOR);
            if (totalAdmins >= MAX_ADMINISTRADORES) {
                throw new BadRequestException("Se ha alcanzado el máximo número de administradores (" + MAX_ADMINISTRADORES + ")");
            }
        }

        usuario.setRol(nuevoRol);
        Usuario guardado = usuarioRepository.save(usuario);

        auditService.log(AuditAction.USER_ROLE_CHANGE, "usuario", guardado.getId(),
                rolActual.name(), nuevoRol.name(),
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Rol del usuario {} cambiado de {} a {} por {}", guardado.getEmail(), rolActual, nuevoRol, actor.getEmail());
        return convertToDTO(guardado);
    }

    @Transactional
    public void desactivarUsuario(Long id) {
        Usuario actor = obtenerUsuarioAutenticado();
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (usuario.getRol() == Role.ADMINISTRADOR) {
            long adminActivos = usuarioRepository.findActivosByRol(Role.ADMINISTRADOR).size();
            if (adminActivos <= 1) {
                throw new BadRequestException("No se puede desactivar el único administrador activo");
            }
        }

        usuario.setActivo(false);
        usuarioRepository.save(usuario);

        auditService.log(AuditAction.USER_DEACTIVATE, "usuario", usuario.getId(),
                "true", "false",
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Usuario {} desactivado por {}", usuario.getEmail(), actor.getEmail());
    }

    @Transactional
    public void activarUsuario(Long id) {
        Usuario actor = obtenerUsuarioAutenticado();
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        usuario.setActivo(true);
        usuarioRepository.save(usuario);

        auditService.log(AuditAction.USER_ACTIVATE, "usuario", usuario.getId(),
                "false", "true",
                actor.getId(), actor.getEmail(), actor.getRol().name());

        log.info("Usuario {} activado por {}", usuario.getEmail(), actor.getEmail());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Usuario no autenticado");
        }
        return usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private void aplicarCambiosPerfil(Usuario usuario, UpdateProfileRequest request) {
        if (request.getNombre() != null && !request.getNombre().isBlank()) {
            usuario.setNombre(request.getNombre());
        }
        if (request.getApellido() != null) {
            usuario.setApellido(request.getApellido());
        }
        if (request.getTelefono() != null) {
            usuario.setTelefono(request.getTelefono());
        }
        if (request.getDireccion() != null) {
            usuario.setDireccion(request.getDireccion());
        }
    }

    private UsuarioResponse convertToDTO(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .cedula(usuario.getCedula())
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .rol(usuario.getRol().name())
                .activo(usuario.getActivo())
                .emailVerificado(usuario.getEmailVerificado())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .fechaCreacion(usuario.getFechaCreacion() != null ? usuario.getFechaCreacion().toString() : null)
                .fechaActualizacion(usuario.getFechaActualizacion() != null ? usuario.getFechaActualizacion().toString() : null)
                .ultimoAcceso(usuario.getUltimoAcceso() != null ? usuario.getUltimoAcceso().toString() : null)
                .build();
    }
}
