package com.example.sigac.service;

import com.example.sigac.audit.AuditAction;
import com.example.sigac.audit.AuditService;
import com.example.sigac.event.IncidenciaCreatedEvent;
import com.example.sigac.model.CategoriaIncidencia;
import com.example.sigac.model.EstadoIncidencia;
import com.example.sigac.model.PrioridadIncidencia;
import com.example.sigac.repository.IncidenciaRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiClassificationService {

    private final IncidenciaRepository incidenciaRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // ─── Entry point ─────────────────────────────────────────────────────────
    // Fires after the creating transaction commits, then runs asynchronously.

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("classificationExecutor")
    public void onIncidenciaCreada(IncidenciaCreatedEvent event) {
        try {
            ClasificacionIaResult result = geminiApiKey.isBlank()
                    ? clasificarPorReglas(event.titulo(), event.descripcion())
                    : clasificarConGemini(event.titulo(), event.descripcion());

            aplicarClasificacion(event.incidenciaId(), result);

            log.info("Incidencia {} clasificada — cat={} prio={} válida={} confianza={}",
                    event.incidenciaId(), result.getCategoria(), result.getPrioridad(),
                    result.isEsValido(), String.format("%.2f", result.getConfianza()));

        } catch (Exception e) {
            log.error("Error en clasificación IA, incidencia {}: {}", event.incidenciaId(), e.getMessage());
        }
    }

    // ─── Clasificación con Gemini API ────────────────────────────────────────

    private ClasificacionIaResult clasificarConGemini(String titulo, String descripcion) throws Exception {
        // System instruction
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ArrayNode sysParts = systemInstruction.putArray("parts");
        sysParts.addObject().put("text", SYSTEM_PROMPT);

        // User message
        ArrayNode contents = objectMapper.createArrayNode();
        ObjectNode userMsg = contents.addObject();
        userMsg.put("role", "user");
        userMsg.putArray("parts").addObject().put("text", buildUserPrompt(titulo, descripcion));

        // Generation config — JSON mode nativo de Gemini
        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("temperature", 0.1);
        generationConfig.put("maxOutputTokens", 512);

        ObjectNode body = objectMapper.createObjectNode();
        body.set("systemInstruction", systemInstruction);
        body.set("contents", contents);
        body.set("generationConfig", generationConfig);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + geminiApiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("Gemini API retornó HTTP {}, usando reglas como fallback. Body: {}",
                    response.statusCode(), response.body());
            return clasificarPorReglas(titulo, descripcion);
        }

        JsonNode root = objectMapper.readTree(response.body());
        String text = root.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text").asText();

        ClasificacionIaResult result = parsearRespuesta(text);

        if (result == null) {
            log.warn("No se pudo parsear respuesta de Gemini, usando reglas como fallback");
            return clasificarPorReglas(titulo, descripcion);
        }
        return result;
    }

    // ─── Clasificación por reglas (fallback sin API key) ─────────────────────

    private static final Map<CategoriaIncidencia, String[]> KEYWORDS = Map.of(
            CategoriaIncidencia.SEGURIDAD,
                new String[]{"robo", "asalto", "hurto", "vandalismo", "pelea", "arma", "delito", "violencia", "inseguridad"},
            CategoriaIncidencia.INFRAESTRUCTURA,
                new String[]{"bache", "alcantarilla", "poste", "puente", "vía", "carretera", "acera", "vereda", "semáforo", "pavimento"},
            CategoriaIncidencia.SERVICIOS_PUBLICOS,
                new String[]{"agua", "luz", "basura", "alcantarillado", "electricidad", "alumbrado", "recolección", "transporte"},
            CategoriaIncidencia.MEDIO_AMBIENTE,
                new String[]{"contaminación", "basural", "río", "tala", "desecho", "quema", "humo", "residuo", "vertedero"}
    );

    private ClasificacionIaResult clasificarPorReglas(String titulo, String descripcion) {
        String texto = (titulo + " " + descripcion).toLowerCase();
        boolean esValido = titulo.trim().length() >= 5
                && descripcion.trim().length() >= 10
                && !texto.matches(".*(\\bhola\\b|\\btest\\b|\\bprueba\\b|\\basdf\\b|\\bqwerty\\b).*");

        if (!esValido) {
            return ClasificacionIaResult.builder()
                    .categoria(CategoriaIncidencia.OTRO).prioridad(PrioridadIncidencia.BAJA)
                    .esValido(false).confianza(0.90)
                    .resumen("Contenido insuficiente o no relacionado con incidencias cívicas")
                    .razonRechazo("El reporte no contiene información suficiente para ser procesado")
                    .build();
        }

        CategoriaIncidencia categoria = CategoriaIncidencia.OTRO;
        int maxMatches = 0;
        for (var entry : KEYWORDS.entrySet()) {
            long matches = Arrays.stream(entry.getValue()).filter(texto::contains).count();
            if (matches > maxMatches) {
                maxMatches = (int) matches;
                categoria = entry.getKey();
            }
        }

        PrioridadIncidencia prioridad = categoria == CategoriaIncidencia.SEGURIDAD
                ? PrioridadIncidencia.ALTA : PrioridadIncidencia.MEDIA;
        if (texto.matches(".*(urgente|emergencia|peligro|inmediato|grave|crítico).*"))
            prioridad = PrioridadIncidencia.CRITICA;

        return ClasificacionIaResult.builder()
                .categoria(categoria).prioridad(prioridad).esValido(true)
                .confianza(maxMatches > 0 ? 0.65 : 0.40)
                .resumen(titulo.length() > 80 ? titulo.substring(0, 80) + "..." : titulo)
                .razonRechazo(null)
                .build();
    }

    // ─── Persistir resultado ──────────────────────────────────────────────────

    private void aplicarClasificacion(Long incidenciaId, ClasificacionIaResult result) {
        incidenciaRepository.findById(incidenciaId).ifPresent(incidencia -> {
            incidencia.setIaClasificado(true);
            incidencia.setIaCategoria(result.getCategoria());
            incidencia.setIaPrioridad(result.getPrioridad());
            incidencia.setIaConfianza(result.getConfianza());
            incidencia.setIaResumen(result.getResumen());
            incidencia.setIaRazonRechazo(result.getRazonRechazo());

            if (result.getCategoria() != null) incidencia.setCategoria(result.getCategoria());
            if (result.getPrioridad() != null) incidencia.setPrioridad(result.getPrioridad());

            if (!result.isEsValido()) {
                incidencia.setEstado(EstadoIncidencia.RECHAZADO);
                incidencia.setFechaResolucion(LocalDateTime.now());
            }

            incidenciaRepository.save(incidencia);

            String resumenAudit = (result.isEsValido() ? "VÁLIDA" : "RECHAZADA")
                    + " | cat=" + result.getCategoria()
                    + " | prio=" + result.getPrioridad()
                    + " | conf=" + String.format("%.2f", result.getConfianza());

            auditService.log(AuditAction.INCIDENT_AI_CLASSIFIED, "incidencia", incidenciaId,
                    null, resumenAudit, null, "sistema-ia", "SISTEMA");
        });
    }

    // ─── Parser de respuesta JSON ─────────────────────────────────────────────

    private ClasificacionIaResult parsearRespuesta(String text) {
        try {
            String json = text.replaceAll("(?s)```json\\s*", "").replaceAll("```\\s*", "").trim();
            JsonNode node = objectMapper.readTree(json);
            return ClasificacionIaResult.builder()
                    .categoria(parseEnum(CategoriaIncidencia.class, node.path("categoria").asText(), CategoriaIncidencia.OTRO))
                    .prioridad(parseEnum(PrioridadIncidencia.class, node.path("prioridad").asText(), PrioridadIncidencia.MEDIA))
                    .esValido(node.path("esValido").asBoolean(true))
                    .confianza(Math.min(1.0, Math.max(0.0, node.path("confianza").asDouble(0.7))))
                    .resumen(node.path("resumen").asText(""))
                    .razonRechazo(node.path("razonRechazo").isNull() ? null : node.path("razonRechazo").asText(null))
                    .build();
        } catch (Exception e) {
            return null;
        }
    }

    private <T extends Enum<T>> T parseEnum(Class<T> clazz, String value, T defaultValue) {
        try {
            return Enum.valueOf(clazz, value.trim().toUpperCase());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    // ─── Prompts ─────────────────────────────────────────────────────────────

    private static final String SYSTEM_PROMPT = """
            You are a classification assistant for SIGAC, a citizen incident reporting platform in Ecuador.
            Analyze the incident report and respond ONLY with a valid JSON object. No markdown, no explanation.
            """;

    private String buildUserPrompt(String titulo, String descripcion) {
        return """
                Classify this citizen incident report:

                Title: %s
                Description: %s

                Respond with exactly this JSON:
                {
                  "categoria": "INFRAESTRUCTURA|SEGURIDAD|SERVICIOS_PUBLICOS|MEDIO_AMBIENTE|OTRO",
                  "prioridad": "BAJA|MEDIA|ALTA|CRITICA",
                  "esValido": true or false,
                  "confianza": 0.0 to 1.0,
                  "resumen": "One sentence in Spanish summarizing the issue",
                  "razonRechazo": null or "Reason in Spanish why this is invalid"
                }

                Categories: INFRAESTRUCTURA=roads/potholes/bridges/sidewalks, SEGURIDAD=crime/assault/vandalism,
                SERVICIOS_PUBLICOS=water/electricity/garbage/sewage, MEDIO_AMBIENTE=pollution/illegal-dumping/deforestation.
                Priorities: CRITICA=immediate danger to life, ALTA=urgent, MEDIA=moderate, BAJA=minor.
                Set esValido=false ONLY for: test/spam/incomprehensible/completely off-topic content.
                """.formatted(titulo, descripcion);
    }

    // ─── Result DTO ───────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class ClasificacionIaResult {
        private CategoriaIncidencia categoria;
        private PrioridadIncidencia prioridad;
        private boolean esValido;
        private double confianza;
        private String resumen;
        private String razonRechazo;
    }
}
