package com.example.sigac.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IncidenciaMultimediaResponse {
    private Long id;
    private String s3Key;
    private String nombreOriginal;
    private String tipoContenido;
    private Long tamanoBytes;
    private int orden;
    private String fechaSubida;
    private String url;
}
