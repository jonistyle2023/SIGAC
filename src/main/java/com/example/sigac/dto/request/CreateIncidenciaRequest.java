package com.example.sigac.dto.request;

import com.example.sigac.model.CategoriaIncidencia;
import com.example.sigac.model.PrioridadIncidencia;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateIncidenciaRequest {

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 200, message = "El título no puede superar los 200 caracteres")
    private String titulo;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 5000, message = "La descripción no puede superar los 5000 caracteres")
    private String descripcion;

    @NotNull(message = "La categoría es obligatoria")
    private CategoriaIncidencia categoria;

    private PrioridadIncidencia prioridad;

    @DecimalMin(value = "-90.0", message = "Latitud debe estar entre -90 y 90")
    @DecimalMax(value = "90.0", message = "Latitud debe estar entre -90 y 90")
    private BigDecimal latitud;

    @DecimalMin(value = "-180.0", message = "Longitud debe estar entre -180 y 180")
    @DecimalMax(value = "180.0", message = "Longitud debe estar entre -180 y 180")
    private BigDecimal longitud;

    @Size(max = 500, message = "La dirección de referencia no puede superar los 500 caracteres")
    private String direccionReferencia;
}
