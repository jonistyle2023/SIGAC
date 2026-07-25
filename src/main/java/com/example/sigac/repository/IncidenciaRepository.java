package com.example.sigac.repository;

import com.example.sigac.model.EstadoIncidencia;
import com.example.sigac.model.Incidencia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IncidenciaRepository extends JpaRepository<Incidencia, Long> {

    Page<Incidencia> findAllByOrderByFechaCreacionDesc(Pageable pageable);

    Page<Incidencia> findByEstadoOrderByFechaCreacionDesc(EstadoIncidencia estado, Pageable pageable);

    Page<Incidencia> findByCiudadanoIdOrderByFechaCreacionDesc(Long ciudadanoId, Pageable pageable);

    Page<Incidencia> findByCiudadanoIdAndEstadoOrderByFechaCreacionDesc(Long ciudadanoId, EstadoIncidencia estado, Pageable pageable);

    Page<Incidencia> findByEntidadAsignadaIdOrderByFechaCreacionDesc(Long entidadId, Pageable pageable);

    Page<Incidencia> findByEntidadAsignadaIdAndEstadoOrderByFechaCreacionDesc(Long entidadId, EstadoIncidencia estado, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Incidencia i WHERE i.ciudadano.id = :ciudadanoId")
    long countByCiudadanoId(@Param("ciudadanoId") Long ciudadanoId);

    // JOIN FETCH evita el N+1 en el reporte: sin esto, extraerFila()/obtenerKpis() disparan una
    // query extra por incidencia al acceder a ciudadano/entidadAsignada (FetchType.LAZY).
    @Query("SELECT i FROM Incidencia i " +
            "LEFT JOIN FETCH i.ciudadano " +
            "LEFT JOIN FETCH i.entidadAsignada " +
            "WHERE i.fechaCreacion BETWEEN :desde AND :hasta " +
            "ORDER BY i.fechaCreacion DESC")
    List<Incidencia> findByFechaCreacionBetweenOrderByFechaCreacionDesc(
            @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
