package com.example.sigac.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class IncidenciaResponse {
    private Long id;
    private String titulo;
    private String descripcion;
    private String categoria;
    private String estado;
    private String prioridad;

    private Long ciudadanoId;
    private String ciudadanoNombre;
    private String ciudadanoEmail;

    private Long entidadAsignadaId;
    private String entidadAsignadaNombre;

    private BigDecimal latitud;
    private BigDecimal longitud;
    private String direccionReferencia;

    private String fechaCreacion;
    private String fechaActualizacion;
    private String fechaResolucion;

    private List<IncidenciaMultimediaResponse> multimedia;

    // Módulo 4 — resultado de clasificación IA
    private Boolean iaClasificado;
    private String  iaCategoria;
    private String  iaPrioridad;
    private Double  iaConfianza;
    private String  iaResumen;
    private String  iaRazonRechazo;
}
