package com.example.sigac.repository;

import com.example.sigac.model.IncidenciaMultimedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidenciaMultimediaRepository extends JpaRepository<IncidenciaMultimedia, Long> {

    List<IncidenciaMultimedia> findByIncidenciaIdOrderByOrden(Long incidenciaId);

    long countByIncidenciaId(Long incidenciaId);

    Optional<IncidenciaMultimedia> findByS3Key(String s3Key);
}
