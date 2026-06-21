package com.example.sigac.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ConfirmarMultimediaRequest {

    @NotBlank(message = "La clave S3 es obligatoria")
    private String s3Key;

    @NotBlank(message = "El nombre original es obligatorio")
    private String nombreOriginal;

    @NotBlank(message = "El tipo de contenido es obligatorio")
    private String contentType;

    @Positive(message = "El tamaño debe ser mayor a 0")
    private Long tamanoBytes;
}
