package com.example.sigac.dto.request;

import com.example.sigac.model.EstadoIncidencia;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CambiarEstadoRequest {

    @NotNull(message = "El nuevo estado es obligatorio")
    private EstadoIncidencia estado;
}
