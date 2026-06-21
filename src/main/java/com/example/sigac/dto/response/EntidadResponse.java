package com.example.sigac.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EntidadResponse {
    private Long id;
    private String nombre;
    private String tipo;
    private String descripcion;
    private String telefono;
    private String emailContacto;
    private Boolean activo;
    private String fechaCreacion;
    private Long totalFuncionarios;
}
