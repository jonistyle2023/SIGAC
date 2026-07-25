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
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseResponse;
import software.amazon.awssdk.services.bedrockruntime.model.ImageBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ImageFormat;
import software.amazon.awssdk.services.bedrockruntime.model.ImageSource;
import software.amazon.awssdk.services.bedrockruntime.model.InferenceConfiguration;
import software.amazon.awssdk.services.bedrockruntime.model.Message;
import software.amazon.awssdk.services.bedrockruntime.model.SystemContentBlock;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiClassificationService {

    private final IncidenciaRepository incidenciaRepository;
    private final IncidenciaMultimediaRepository multimediaRepository;
    private final AuditService auditService;
    private final S3Service s3Service;
    private final ObjectMapper objectMapper;
    private final BedrockRuntimeClient bedrockRuntimeClient;

    @Value("${bedrock.model-id:us.anthropic.claude-haiku-4-5-20251001-v1:0}")
    private String modelId;

    @Value("${sigac.ia.umbral-confianza:0.65}")
    private double umbralConfianza;

    private static final int TITULO_MAX_LENGTH = 200;
    private static final int MAX_OUTPUT_TOKENS = 512;

    // ─── Entry point ─────────────────────────────────────────────────────────
    // Fires after la evidencia (primera foto) queda confirmada, tras el commit, de forma asíncrona.

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("classificationExecutor")
    public void onEvidenciaLista(IncidenciaEvidenciaListaEvent event) {
        ClasificacionIaResult result;
        try {
            byte[] imagenOriginal = s3Service.descargarObjeto(event.s3Key());
            String mimeTypeOriginal = multimediaRepository.findByS3Key(event.s3Key())
                    .map(m -> m.getTipoContenido())
                    .orElse("image/jpeg");
            S3Service.ImagenProcesada imagen = s3Service.prepararImagenParaClasificacion(imagenOriginal, mimeTypeOriginal);

            result = clasificarConBedrock(imagen.bytes(), imagen.mimeType(), event.descripcionOpcional());
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

    // ─── Clasificación multimodal con Amazon Bedrock (Converse API) ──────────

    private ClasificacionIaResult clasificarConBedrock(byte[] imagen, String mimeType, String descripcion) {
        Message userMessage = Message.builder()
                .role(ConversationRole.USER)
                .content(
                        ContentBlock.fromText(buildUserPrompt(descripcion)),
                        ContentBlock.fromImage(ImageBlock.builder()
                                .format(mapImageFormat(mimeType))
                                .source(ImageSource.fromBytes(SdkBytes.fromByteArray(imagen)))
                                .build())
                )
                .build();

        ConverseRequest request = ConverseRequest.builder()
                .modelId(modelId)
                .system(SystemContentBlock.fromText(SYSTEM_PROMPT))
                .messages(userMessage)
                .inferenceConfig(InferenceConfiguration.builder()
                        .maxTokens(MAX_OUTPUT_TOKENS)
                        .temperature(0.1f)
                        .build())
                .build();

        ConverseResponse response = bedrockRuntimeClient.converse(request);
        String text = response.output().message().content().get(0).text();

        ClasificacionIaResult result = parsearRespuesta(text);
        if (result == null) {
            log.warn("No se pudo parsear respuesta del modelo, incidencia queda para revisión manual. Respuesta cruda: {}", text);
        } else if ((result.getTitulo() == null || result.getTitulo().isBlank())
                || (result.getResumen() == null || result.getResumen().isBlank())) {
            log.warn("El modelo devolvió titulo/resumen vacío (esValido={}, categoria={}). Descripción del ciudadano presente={}. Respuesta cruda: {}",
                    result.isEsValido(), result.getCategoria(), descripcion != null && !descripcion.isBlank(), text);
        }
        return result;
    }

    private ImageFormat mapImageFormat(String mimeType) {
        if (mimeType == null) return ImageFormat.JPEG;
        return switch (mimeType.toLowerCase()) {
            case "image/png" -> ImageFormat.PNG;
            case "image/webp" -> ImageFormat.WEBP;
            case "image/gif" -> ImageFormat.GIF;
            default -> ImageFormat.JPEG;
        };
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
            // iaClasificado queda en false a propósito: la IA nunca produjo un resultado real
            // (fallo de red, cuota excedida, respuesta no parseable), así que no hay nada que
            // mostrar como "análisis". Mostrar 0% de certeza aquí sería engañoso — ver historial.
            //
            // El estado queda en PENDIENTE (no se toca) a propósito también: IncidenciaService.actualizar()
            // solo deja editar al ciudadano mientras está PENDIENTE. Si aquí lo pasáramos a EN_REVISION,
            // el ciudadano perdería la única ventana para agregar título/descripción manualmente justo
            // cuando la IA no pudo hacerlo por él.
            incidencia.setRequiereRevisionManual(true);
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
                  "razonRechazo": null or "Mensaje en español (ver instrucciones abajo)"
                }

                Categorías: INFRAESTRUCTURA=vías/baches/puentes/aceras, SEGURIDAD=crimen/asalto/vandalismo,
                SERVICIOS_PUBLICOS=agua/electricidad/basura/alcantarillado, MEDIO_AMBIENTE=contaminación/vertederos/tala.
                Marca esValido=false SOLO si la imagen no muestra ninguna incidencia cívica identificable
                (foto irrelevante, ilegible, o contenido claramente no relacionado con un reporte cívico).

                Si esValido=true: "titulo" y "resumen" son OBLIGATORIOS y nunca pueden quedar vacíos ni ser
                genéricos — describe específicamente lo que ves en la imagen, incluso si el ciudadano no
                escribió ninguna descripción de texto.

                Si esValido=false: "razonRechazo" NO debe sonar como un mensaje de error de sistema. Debe sonar
                como un asistente simpático que sí miró la foto con atención: reacciona primero con una
                observación breve y genuina sobre lo que aparece (por ejemplo, si es una mascota, elógiala
                específicamente; si es comida, un selfie, un paisaje, etc., comenta algo simpático y concreto
                sobre eso), y luego invita con calidez a enviar una foto real del problema a reportar. Máximo
                2 oraciones, tono cercano y humano — nunca un genérico "esto no es una incidencia válida".
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
