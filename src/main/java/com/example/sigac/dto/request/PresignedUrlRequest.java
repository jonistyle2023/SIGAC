package com.example.sigac.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PresignedUrlRequest {

    @NotBlank(message = "El nombre del archivo es obligatorio")
    @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
    private String fileName;

    @NotBlank(message = "El tipo de contenido es obligatorio")
    @Pattern(
        regexp = "^(image/(jpeg|png|webp|gif)|video/(mp4|quicktime)|application/pdf)$",
        message = "Tipo de contenido no permitido. Use: image/jpeg, image/png, image/webp, image/gif, video/mp4, video/quicktime, application/pdf"
    )
    private String contentType;
}
