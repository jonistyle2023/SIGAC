package com.example.sigac.service;

import com.example.sigac.dto.response.UsuarioResponse;
import com.example.sigac.exception.ResourceNotFoundException;
import com.example.sigac.exception.UnauthorizedException;
import com.example.sigac.model.Usuario;
import com.example.sigac.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPerfil() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Usuario no autenticado");
        }

        String email = auth.getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        return convertToDTO(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return convertToDTO(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return convertToDTO(usuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerTodosActivos() {
        return usuarioRepository.findAllActivos()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional
    public void desactivarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        // Evitar desactivar el último administrador
        if (usuario.getRol().name().equals("ADMINISTRADOR")) {
            long adminActivos = usuarioRepository.findActivosByRol(usuario.getRol()).size();
            if (adminActivos <= 1) {
                throw new IllegalStateException("No se puede desactivar el último administrador");
            }
        }

        usuario.setActivo(false);
        usuarioRepository.save(usuario);
        log.info("Usuario desactivado: {}", usuario.getEmail());
    }

    @Transactional
    public void activarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        usuario.setActivo(true);
        usuarioRepository.save(usuario);
        log.info("Usuario activado: {}", usuario.getEmail());
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
                .build();
    }
}

