package com.example.sigac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "incidencias")
public class Incidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CategoriaIncidencia categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private EstadoIncidencia estado = EstadoIncidencia.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PrioridadIncidencia prioridad = PrioridadIncidencia.MEDIA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ciudadano_id", nullable = false)
    private Usuario ciudadano;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidad_asignada_id", nullable = true)
    private Usuario entidadAsignada;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitud;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitud;

    @Column(name = "direccion_referencia", length = 500)
    private String direccionReferencia;

    @Column(name = "fecha_creacion", nullable = false)
    @Builder.Default
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    @OneToMany(mappedBy = "incidencia", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<IncidenciaMultimedia> multimedia = new ArrayList<>();

    // ─── Campos de clasificación IA (Módulo 4) ───────────────────────────────

    @Column(name = "ia_clasificado")
    @Builder.Default
    private Boolean iaClasificado = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "ia_categoria", length = 50)
    private CategoriaIncidencia iaCategoria;

    @Enumerated(EnumType.STRING)
    @Column(name = "ia_prioridad", length = 20)
    private PrioridadIncidencia iaPrioridad;

    @Column(name = "ia_confianza")
    private Double iaConfianza;

    @Column(name = "ia_resumen", length = 500)
    private String iaResumen;

    @Column(name = "ia_razon_rechazo", length = 500)
    private String iaRazonRechazo;

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
}
