package com.example.sigac.controller;

import com.example.sigac.dto.response.ReporteKpisResponse;
import com.example.sigac.model.CategoriaIncidencia;
import com.example.sigac.model.EstadoIncidencia;
import com.example.sigac.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/kpis")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ReporteKpisResponse> obtenerKpis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.obtenerKpis(desde, hasta));
    }

    @GetMapping("/exportar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<byte[]> exportar(
            @RequestParam String formato,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) EstadoIncidencia estado,
            @RequestParam(required = false) CategoriaIncidencia categoria) {
        ReporteService.ReporteArchivo archivo = reporteService.exportar(formato, desde, hasta, estado, categoria);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + archivo.nombreArchivo() + "\"")
                .body(archivo.contenido());
    }
}
