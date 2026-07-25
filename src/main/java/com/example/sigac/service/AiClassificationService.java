package com.example.sigac.service;

import com.example.sigac.audit.AuditAction;
import com.example.sigac.audit.AuditService;
import com.example.sigac.event.IncidenciaEvidenciaListaEvent;
import com.example.sigac.model.CategoriaIncidencia;
import com.example.sigac.model.EstadoIncidencia;
import com.example.sigac.model.PrioridadIncidencia;
import com.example.sigac.repository.IncidenciaMultimediaRepository;
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
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiClassificationService {

    private final IncidenciaRepository incidenciaRepository;
    private final IncidenciaMultimediaRepository multimediaRepository;
    private final AuditService auditService;
    private final S3Service s3Service;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${sigac.ia.umbral-confianza:0.65}")
    private double umbralConfianza;

    private static final int TITULO_MAX_LENGTH = 200;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // ─── Entry point ─────────────────────────────────────────────────────────
    // Fires after la evidencia (primera foto) queda confirmada, tras el commit, de forma asíncrona.

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("classificationExecutor")
    public void onEvidenciaLista(IncidenciaEvidenciaListaEvent event) {
        if (geminiApiKey.isBlank()) {
            log.warn("Gemini API key no configurada; incidencia {} queda marcada para revisión manual", event.incidenciaId());
            marcarRevisionManualPorFallo(event.incidenciaId());
            return;
        }

        ClasificacionIaResult result;
        try {
            byte[] imagenOriginal = s3Service.descargarObjeto(event.s3Key());
            String mimeTypeOriginal = multimediaRepository.findByS3Key(event.s3Key())
                    .map(m -> m.getTipoContenido())
                    .orElse("image/jpeg");
            S3Service.ImagenProcesada imagen = s3Service.prepararImagenParaClasificacion(imagenOriginal, mimeTypeOriginal);

            result = clasificarConGemini(imagen.bytes(), imagen.mimeType(), event.descripcionOpcional());
        } catch (Exception e) {
            log.error("Error en clasificación IA, incidencia {}: {}", event.incidenciaId(), e.getMessage());
            result = null;
        }

        if (result == null) {
            marcarRevisionManualPorFallo(event.incidenciaId());
            return;
        }

        aplicarClasificacion(event.incidenciaId(), result);

        log.info("Incidencia {} clasificada — cat={} prio={} válida={} confianza={}",
                event.incidenciaId(), result.getCategoria(), result.getPrioridad(),
                result.isEsValido(), String.format("%.2f", result.getConfianza()));
    }

    // ─── Clasificación multimodal con Gemini API ─────────────────────────────

    private ClasificacionIaResult clasificarConGemini(byte[] imagen, String mimeType, String descripcion) throws Exception {
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ArrayNode sysParts = systemInstruction.putArray("parts");
        sysParts.addObject().put("text", SYSTEM_PROMPT);

        ArrayNode contents = objectMapper.createArrayNode();
        ObjectNode userMsg = contents.addObject();
        userMsg.put("role", "user");
        ArrayNode parts = userMsg.putArray("parts");
        parts.addObject().put("text", buildUserPrompt(descripcion));
        ObjectNode inlineData = parts.addObject().putObject("inline_data");
        inlineData.put("mime_type", mimeType);
        inlineData.put("data", Base64.getEncoder().encodeToString(imagen));

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
            log.warn("Gemini API retornó HTTP {}, incidencia queda para revisión manual. Body: {}",
                    response.statusCode(), response.body());
            return null;
        }

        JsonNode root = objectMapper.readTree(response.body());
        String text = root.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text").asText();

        ClasificacionIaResult result = parsearRespuesta(text);
        if (result == null) {
            log.warn("No se pudo parsear respuesta de Gemini, incidencia queda para revisión manual");
        }
        return result;
    }

    // ─── Persistir resultado ──────────────────────────────────────────────────

    @Transactional
    void aplicarClasificacion(Long incidenciaId, ClasificacionIaResult result) {
        incidenciaRepository.findById(incidenciaId).ifPresent(incidencia -> {
            incidencia.setIaClasificado(true);
            incidencia.setIaCategoria(result.getCategoria());
            incidencia.setIaPrioridad(result.getPrioridad());
            incidencia.setIaConfianza(result.getConfianza());
            incidencia.setIaResumen(result.getResumen());
            incidencia.setIaRazonRechazo(result.getRazonRechazo());

            if (result.getTitulo() != null && !result.getTitulo().isBlank()
                    && (incidencia.getTitulo() == null || incidencia.getTitulo().isBlank())) {
                incidencia.setTitulo(truncar(result.getTitulo(), TITULO_MAX_LENGTH));
            }
            if (result.getCategoria() != null) incidencia.setCategoria(result.getCategoria());
            if (result.getPrioridad() != null) incidencia.setPrioridad(result.getPrioridad());

            boolean requiereRevision = result.getConfianza() < umbralConfianza;

            if (!result.isEsValido()) {
                incidencia.setEstado(EstadoIncidencia.RECHAZADO);
                incidencia.setFechaResolucion(LocalDateTime.now());
            }

            if (result.getPrioridad() == PrioridadIncidencia.CRITICA) {
                requiereRevision = true;
                auditService.log(AuditAction.INCIDENT_CRITICAL_ALERT, "incidencia", incidenciaId,
                        null, "Prioridad CRITICA detectada por IA — requiere validación humana inmediata",
                        null, "sistema-ia", "SISTEMA");
            }

            incidencia.setRequiereRevisionManual(requiereRevision);
            incidenciaRepository.save(incidencia);

            String resumenAudit = (result.isEsValido() ? "VÁLIDA" : "RECHAZADA")
                    + " | cat=" + result.getCategoria()
                    + " | prio=" + result.getPrioridad()
                    + " | conf=" + String.format("%.2f", result.getConfianza())
                    + " | revisiónManual=" + requiereRevision;

            auditService.log(AuditAction.INCIDENT_AI_CLASSIFIED, "incidencia", incidenciaId,
                    null, resumenAudit, null, "sistema-ia", "SISTEMA");
        });
    }

    @Transactional
    void marcarRevisionManualPorFallo(Long incidenciaId) {
        incidenciaRepository.findById(incidenciaId).ifPresent(incidencia -> {
            incidencia.setIaClasificado(true);
            incidencia.setIaConfianza(0.0);
            incidencia.setRequiereRevisionManual(true);
            incidencia.setEstado(EstadoIncidencia.EN_REVISION);
            incidenciaRepository.save(incidencia);

            auditService.log(AuditAction.INCIDENT_AI_CLASSIFIED, "incidencia", incidenciaId,
                    null, "SIN_CLASIFICAR | requiere revisión manual (fallo o sin respuesta del modelo)",
                    null, "sistema-ia", "SISTEMA");
        });
    }

    private String truncar(String texto, int maxLength) {
        return texto.length() > maxLength ? texto.substring(0, maxLength) : texto;
    }

    // ─── Parser de respuesta JSON ─────────────────────────────────────────────

    private ClasificacionIaResult parsearRespuesta(String text) {
        try {
            String json = text.replaceAll("(?s)```json\\s*", "").replaceAll("```\\s*", "").trim();
            JsonNode node = objectMapper.readTree(json);
            return ClasificacionIaResult.builder()
                    .titulo(node.path("titulo").isMissingNode() || node.path("titulo").isNull()
                            ? null : node.path("titulo").asText(null))
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
            You receive a photo taken by a citizen — the photo is the primary evidence — plus an optional
            text description. Analyze the image first; use the text only as supporting context when present.
            Respond ONLY with a valid JSON object. No markdown, no explanation.
            """;

    private String buildUserPrompt(String descripcion) {
        String contextoTexto = (descripcion != null && !descripcion.isBlank())
                ? "El ciudadano agregó esta descripción como contexto adicional: \"" + descripcion + "\""
                : "El ciudadano no proporcionó descripción de texto. Basa tu clasificación únicamente en la evidencia visual de la imagen.";

        return """
                Analiza la imagen adjunta de un reporte ciudadano de incidencias.

                %s

                Criterios de gravedad (tabla de 4 niveles, úsala para elegir "prioridad"):
                - CRITICA: peligro inmediato para la vida o la seguridad (incendio activo, cables eléctricos caídos y energizados, socavón que puede tragar vehículos o personas, violencia en curso, colapso estructural inminente).
                - ALTA: riesgo significativo si no se atiende pronto, sin peligro de vida inmediato (bache profundo en vía principal, semáforo dañado en intersección concurrida, fuga de agua importante).
                - MEDIA: problema real que afecta la calidad de vida sin riesgo inminente (acera rota, basura acumulada, poste caído en zona de bajo tránsito).
                - BAJA: molestia menor o estética (grafiti, jardín descuidado, luminaria parpadeante).

                Responde ÚNICAMENTE con este JSON:
                {
                  "titulo": "Título breve y descriptivo en español de lo que se ve, máximo 200 caracteres",
                  "categoria": "INFRAESTRUCTURA|SEGURIDAD|SERVICIOS_PUBLICOS|MEDIO_AMBIENTE|OTRO",
                  "prioridad": "BAJA|MEDIA|ALTA|CRITICA",
                  "esValido": true or false,
                  "confianza": 0.0 to 1.0,
                  "resumen": "Una oración en español resumiendo el problema",
                  "razonRechazo": null or "Razón en español de por qué esto no es válido"
                }

                Categorías: INFRAESTRUCTURA=vías/baches/puentes/aceras, SEGURIDAD=crimen/asalto/vandalismo,
                SERVICIOS_PUBLICOS=agua/electricidad/basura/alcantarillado, MEDIO_AMBIENTE=contaminación/vertederos/tala.
                Marca esValido=false SOLO si la imagen no muestra ninguna incidencia cívica identificable
                (foto irrelevante, ilegible, o contenido claramente no relacionado con un reporte cívico).
                """.formatted(contextoTexto);
    }

    // ─── Result DTO ───────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class ClasificacionIaResult {
        private String titulo;
        private CategoriaIncidencia categoria;
        private PrioridadIncidencia prioridad;
        private boolean esValido;
        private double confianza;
        private String resumen;
        private String razonRechazo;
    }
}
