package com.example.sigac.model;

public enum Role {
    CIUDADANO("CIUDADANO", "Ciudadano del sistema"),
    ADMINISTRADOR("ADMINISTRADOR", "Administrador del sistema"),
    ENTIDAD_PUBLICA("ENTIDAD_PUBLICA", "Entidad pública");

    private final String nombre;
    private final String descripcion;

    Role(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }
}

