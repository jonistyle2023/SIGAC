package com.example.sigac.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AsignarIncidenciaRequest {

    @NotNull(message = "El ID de la entidad es obligatorio")
    private Long entidadId;
}
