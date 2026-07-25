package com.example.sigac.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteKpisResponse {

    private long totalIncidencias;
    private Map<String, Long> porEstado;
    private Map<String, Long> porCategoria;
    private String categoriaMasFrecuente;
    private Map<String, Long> porEntidad;
    private Double tiempoResolucionPromedioHoras;
}
