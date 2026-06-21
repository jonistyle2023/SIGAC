package com.example.sigac.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String nombre;

    @Size(max = 100, message = "El apellido no debe exceder 100 caracteres")
    private String apellido;

    @Pattern(regexp = "^[0-9+\\-()\\s]*$", message = "El teléfono contiene carácter inválido")
    private String telefono;

    @Size(max = 500, message = "La dirección no debe exceder 500 caracteres")
    private String direccion;
}
