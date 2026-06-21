package com.example.sigac.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterEntidadRequest {

    // Cédula/RUC opcional para entidades públicas
    @Pattern(regexp = "^[0-9]{6,20}$", message = "La cédula/RUC solo debe contener números (6-20 dígitos)")
    private String cedula;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo debe ser válido")
    private String email;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String nombre;

    @Size(max = 100, message = "El apellido no debe exceder 100 caracteres")
    private String apellido;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales"
    )
    private String password;

    @NotBlank(message = "La confirmación de contraseña es obligatoria")
    private String confirmPassword;

    @Pattern(regexp = "^[0-9+\\-()\\s]*$", message = "El teléfono contiene carácter inválido")
    private String telefono;

    private String direccion;

    @NotNull(message = "Debe seleccionar la entidad a la que pertenece el funcionario")
    private Long entidadId;
}