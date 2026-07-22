package com.example.sigac.service;

import com.example.sigac.audit.AuditAction;
import com.example.sigac.audit.AuditService;
import com.example.sigac.dto.response.ReporteKpisResponse;
import com.example.sigac.exception.BadRequestException;
import com.example.sigac.exception.UnauthorizedException;
import com.example.sigac.model.CategoriaIncidencia;
import com.example.sigac.model.EstadoIncidencia;
import com.example.sigac.model.Incidencia;
import com.example.sigac.model.Usuario;
import com.example.sigac.repository.IncidenciaRepository;
import com.example.sigac.repository.UsuarioRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final IncidenciaRepository incidenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditService auditService;

    private static final DateTimeFormatter FECHA_FORMATO = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final List<String> COLUMNAS = List.of(
            "ID", "Título", "Categoría", "Estado", "Prioridad", "Ciudadano",
            "Entidad Asignada", "Fecha Creación", "Fecha Resolución", "Tiempo Resolución (h)");

    public record ReporteArchivo(byte[] contenido, String contentType, String nombreArchivo) {}

    // ─── KPIs ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReporteKpisResponse obtenerKpis(LocalDate desde, LocalDate hasta) {
        List<Incidencia> incidencias = obtenerIncidenciasEnRango(desde, hasta);

        Map<String, Long> porEstado = incidencias.stream()
                .collect(Collectors.groupingBy(i -> i.getEstado().name(), LinkedHashMap::new, Collectors.counting()));

        Map<String, Long> porCategoria = incidencias.stream()
                .collect(Collectors.groupingBy(i -> i.getCategoria().name(), LinkedHashMap::new, Collectors.counting()));

        String categoriaMasFrecuente = porCategoria.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        Map<String, Long> porEntidad = incidencias.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getEntidadAsignada() != null ? i.getEntidadAsignada().getNombre() : "Sin asignar",
                        LinkedHashMap::new, Collectors.counting()));

        java.util.OptionalDouble promedioResolucion = incidencias.stream()
                .filter(i -> i.getEstado() == EstadoIncidencia.RESUELTO && i.getFechaResolucion() != null)
                .mapToDouble(i -> Duration.between(i.getFechaCreacion(), i.getFechaResolucion()).toMinutes() / 60.0)
                .average();
        Double tiempoResolucionPromedioHoras = promedioResolucion.isPresent() ? promedioResolucion.getAsDouble() : null;

        return ReporteKpisResponse.builder()
                .totalIncidencias(incidencias.size())
                .porEstado(porEstado)
                .porCategoria(porCategoria)
                .categoriaMasFrecuente(categoriaMasFrecuente)
                .porEntidad(porEntidad)
                .tiempoResolucionPromedioHoras(tiempoResolucionPromedioHoras != null
                        ? Math.round(tiempoResolucionPromedioHoras * 100) / 100.0 : null)
                .build();
    }

    // ─── Exportación ────────────────────────────────────────────────────────────
    // Nota: no es readOnly porque auditService.log() escribe en audit_logs dentro de la misma transacción.

    @Transactional
    public ReporteArchivo exportar(String formato, LocalDate desde, LocalDate hasta,
                                    EstadoIncidencia estado, CategoriaIncidencia categoria) {
        List<Incidencia> incidencias = obtenerIncidenciasEnRango(desde, hasta).stream()
                .filter(i -> estado == null || i.getEstado() == estado)
                .filter(i -> categoria == null || i.getCategoria() == categoria)
                .sorted(Comparator.comparing(Incidencia::getFechaCreacion).reversed())
                .toList();

        String fechaArchivo = LocalDate.now().toString();

        Usuario actor = obtenerUsuarioAutenticado();
        auditService.log(AuditAction.REPORT_EXPORT, "reporte", null,
                null, "formato=" + formato + " | registros=" + incidencias.size(),
                actor.getId(), actor.getEmail(), actor.getRol().name());

        return switch (formato.toLowerCase()) {
            case "csv" -> new ReporteArchivo(generarCsv(incidencias), "text/csv",
                    "reporte-incidencias-" + fechaArchivo + ".csv");
            case "xlsx" -> new ReporteArchivo(generarExcel(incidencias),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "reporte-incidencias-" + fechaArchivo + ".xlsx");
            case "pdf" -> new ReporteArchivo(generarPdf(incidencias, obtenerKpis(desde, hasta)), "application/pdf",
                    "reporte-incidencias-" + fechaArchivo + ".pdf");
            default -> throw new BadRequestException("Formato de exportación no soportado: " + formato);
        };
    }

    // ─── Generadores ─────────────────────────────────────────────────────────

    private byte[] generarCsv(List<Incidencia> incidencias) {
        StringBuilder sb = new StringBuilder("﻿"); // BOM UTF-8 para acentos en Excel
        sb.append(String.join(",", COLUMNAS)).append("\n");
        for (Incidencia i : incidencias) {
            List<String> fila = extraerFila(i);
            sb.append(fila.stream().map(this::escaparCsv).collect(Collectors.joining(","))).append("\n");
        }
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String escaparCsv(String valor) {
        if (valor == null) return "";
        if (valor.contains(",") || valor.contains("\"") || valor.contains("\n")) {
            return "\"" + valor.replace("\"", "\"\"") + "\"";
        }
        return valor;
    }

    private byte[] generarExcel(List<Incidencia> incidencias) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Incidencias");

            CellStyle estiloHeader = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font fontHeader = workbook.createFont();
            fontHeader.setBold(true);
            estiloHeader.setFont(fontHeader);

            Row header = sheet.createRow(0);
            for (int c = 0; c < COLUMNAS.size(); c++) {
                Cell cell = header.createCell(c);
                cell.setCellValue(COLUMNAS.get(c));
                cell.setCellStyle(estiloHeader);
            }

            int rowNum = 1;
            for (Incidencia i : incidencias) {
                Row row = sheet.createRow(rowNum++);
                List<String> fila = extraerFila(i);
                for (int c = 0; c < fila.size(); c++) {
                    row.createCell(c).setCellValue(fila.get(c));
                }
            }

            for (int c = 0; c < COLUMNAS.size(); c++) {
                sheet.autoSizeColumn(c);
            }

            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar el archivo Excel: " + e.getMessage(), e);
        }
    }

    private byte[] generarPdf(List<Incidencia> incidencias, ReporteKpisResponse kpis) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 30);
            PdfWriter.getInstance(document, bos);
            document.open();

            Font tituloFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Font subtituloFont = new Font(Font.HELVETICA, 11, Font.BOLD);
            Font textoFont = new Font(Font.HELVETICA, 9);
            Font headerFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE);

            Paragraph titulo = new Paragraph("Reporte de Incidencias — SIGAC", tituloFont);
            titulo.setAlignment(Element.ALIGN_CENTER);
            document.add(titulo);

            Paragraph resumen = new Paragraph(
                    "Total: " + kpis.getTotalIncidencias()
                            + "   |   Tiempo de resolución promedio: "
                            + (kpis.getTiempoResolucionPromedioHoras() != null ? kpis.getTiempoResolucionPromedioHoras() + " h" : "N/D")
                            + "   |   Tipo más frecuente: "
                            + (kpis.getCategoriaMasFrecuente() != null ? kpis.getCategoriaMasFrecuente() : "N/D"),
                    subtituloFont);
            resumen.setAlignment(Element.ALIGN_CENTER);
            resumen.setSpacingAfter(15);
            document.add(resumen);

            PdfPTable table = new PdfPTable(COLUMNAS.size());
            table.setWidthPercentage(100);
            for (String columna : COLUMNAS) {
                PdfPCell cell = new PdfPCell(new com.lowagie.text.Phrase(columna, headerFont));
                cell.setBackgroundColor(new Color(37, 99, 235));
                cell.setPadding(4);
                table.addCell(cell);
            }

            for (Incidencia i : incidencias) {
                for (String valor : extraerFila(i)) {
                    PdfPCell cell = new PdfPCell(new com.lowagie.text.Phrase(valor, textoFont));
                    cell.setPadding(3);
                    table.addCell(cell);
                }
            }

            document.add(table);
            document.close();
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar el archivo PDF: " + e.getMessage(), e);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Usuario no autenticado");
        }
        return usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
    }

    private List<Incidencia> obtenerIncidenciasEnRango(LocalDate desde, LocalDate hasta) {
        LocalDateTime inicio = desde != null ? desde.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime fin = hasta != null ? hasta.atTime(23, 59, 59) : LocalDateTime.now();
        if (inicio.isAfter(fin)) {
            throw new BadRequestException("La fecha 'desde' no puede ser posterior a 'hasta'");
        }
        return incidenciaRepository.findByFechaCreacionBetweenOrderByFechaCreacionDesc(inicio, fin);
    }

    private List<String> extraerFila(Incidencia i) {
        Double tiempoResolucionHoras = i.getFechaResolucion() != null
                ? Math.round(Duration.between(i.getFechaCreacion(), i.getFechaResolucion()).toMinutes() / 60.0 * 100) / 100.0
                : null;

        return List.of(
                String.valueOf(i.getId()),
                i.getTitulo(),
                i.getCategoria().name(),
                i.getEstado().name(),
                i.getPrioridad().name(),
                i.getCiudadano().getNombre() + " " + (i.getCiudadano().getApellido() != null ? i.getCiudadano().getApellido() : ""),
                i.getEntidadAsignada() != null ? i.getEntidadAsignada().getNombre() : "Sin asignar",
                i.getFechaCreacion().format(FECHA_FORMATO),
                i.getFechaResolucion() != null ? i.getFechaResolucion().format(FECHA_FORMATO) : "",
                tiempoResolucionHoras != null ? String.valueOf(tiempoResolucionHoras) : ""
        );
    }
}
