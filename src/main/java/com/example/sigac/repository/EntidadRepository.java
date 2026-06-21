package com.example.sigac.repository;

import com.example.sigac.model.Entidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntidadRepository extends JpaRepository<Entidad, Long> {

    List<Entidad> findAllByOrderByNombreAsc();

    List<Entidad> findByActivoTrueOrderByNombreAsc();

    boolean existsByNombreIgnoreCase(String nombre);

    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.entidad.id = :entidadId")
    long countFuncionariosByEntidadId(@Param("entidadId") Long entidadId);
}