package com.example.sigac.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    @Builder.Default
    private String tipo = "Bearer";
    private Long id;
    private String email;
    private String nombre;
    private String rol;
    private String mensaje;
    private Boolean exito;
}

