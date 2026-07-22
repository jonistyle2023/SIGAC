package com.example.sigac.event;

public record IncidenciaEstadoCambiadoEvent(Long incidenciaId, Long ciudadanoId, String titulo,
                                             String estadoAnterior, String estadoNuevo) {}
