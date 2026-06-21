package com.example.sigac.dto.request;

import com.example.sigac.model.TipoEntidad;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateEntidadRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no debe exceder 150 caracteres")
    private String nombre;

    @NotNull(message = "El tipo es obligatorio")
    private TipoEntidad tipo;

    @Size(max = 500, message = "La descripción no debe exceder 500 caracteres")
    private String descripcion;

    private String telefono;

    @Email(message = "El email de contacto debe ser válido")
    private String emailContacto;
}
