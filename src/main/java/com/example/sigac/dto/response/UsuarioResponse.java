package com.example.sigac.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioResponse {

    private Long id;
    private String cedula;
    private String email;
    private String nombre;
    private String apellido;
    private String rol;
    private Boolean activo;
    private Boolean emailVerificado;
    private String telefono;
    private String direccion;
    private String fechaCreacion;
}

