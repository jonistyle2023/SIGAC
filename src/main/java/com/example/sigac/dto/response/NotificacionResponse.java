package com.example.sigac.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificacionResponse {

    private Long id;
    private String tipo;
    private String titulo;
    private String mensaje;
    private Long incidenciaId;
    private Boolean leida;
    private String fechaCreacion;
    private String fechaLectura;
}
