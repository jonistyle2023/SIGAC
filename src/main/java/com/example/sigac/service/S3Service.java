package com.example.sigac.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.Iterator;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    private static final int UPLOAD_EXPIRY_MINUTES = 15;
    private static final int DOWNLOAD_EXPIRY_MINUTES = 60;
    private static final long TAMANO_MAX_SIN_REESCALAR = 1_000_000L; // ~1MB
    private static final int LADO_MAYOR_MAX_PX = 1024;
    private static final float CALIDAD_JPEG = 0.8f;

    public String generarKeySubida(Long incidenciaId, String fileName) {
        String extension = fileName.contains(".")
                ? fileName.substring(fileName.lastIndexOf('.'))
                : "";
        return String.format("incidencias/%d/multimedia/%s%s", incidenciaId, UUID.randomUUID(), extension);
    }

    public String generarPresignedUrlSubida(String s3Key, String contentType) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(UPLOAD_EXPIRY_MINUTES))
                .putObjectRequest(putRequest)
                .build();

        return s3Presigner.presignPutObject(presignRequest).url().toString();
    }

    public String generarPresignedUrlDescarga(String s3Key) {
        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(DOWNLOAD_EXPIRY_MINUTES))
                    .getObjectRequest(getRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.warn("No se pudo generar presigned URL de descarga para key {}: {}", s3Key, e.getMessage());
            return null;
        }
    }

    public byte[] descargarObjeto(String s3Key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();
        return s3Client.getObjectAsBytes(request).asByteArray();
    }

    public record ImagenProcesada(byte[] bytes, String mimeType) {}

    /**
     * Reescala si hace falta y devuelve el mime type real de los bytes resultantes —
     * la recompresión siempre produce JPEG, así que el mime type original ya no aplica en ese caso.
     */
    public ImagenProcesada prepararImagenParaClasificacion(byte[] original, String mimeTypeOriginal) {
        byte[] procesada = reescalarSiEsNecesario(original);
        String mimeType = procesada == original ? mimeTypeOriginal : "image/jpeg";
        return new ImagenProcesada(procesada, mimeType);
    }

    /**
     * Reescala la imagen si supera ~1MB, para controlar costo/latencia al enviarla a un modelo
     * multimodal. Recomprime siempre como JPEG cuando reescala; si no hace falta reescalar,
     * devuelve los bytes originales sin recodificar.
     */
    public byte[] reescalarSiEsNecesario(byte[] original) {
        if (original.length <= TAMANO_MAX_SIN_REESCALAR) {
            return original;
        }
        try {
            BufferedImage imagen = ImageIO.read(new ByteArrayInputStream(original));
            if (imagen == null) {
                log.warn("No se pudo decodificar la imagen para reescalar, se envía sin modificar");
                return original;
            }

            int ancho = imagen.getWidth();
            int alto = imagen.getHeight();
            int ladoMayor = Math.max(ancho, alto);
            double factor = ladoMayor > LADO_MAYOR_MAX_PX ? (double) LADO_MAYOR_MAX_PX / ladoMayor : 1.0;
            int nuevoAncho = (int) Math.round(ancho * factor);
            int nuevoAlto = (int) Math.round(alto * factor);

            BufferedImage escalada = new BufferedImage(nuevoAncho, nuevoAlto, BufferedImage.TYPE_INT_RGB);
            escalada.createGraphics().drawImage(
                    imagen.getScaledInstance(nuevoAncho, nuevoAlto, Image.SCALE_SMOOTH), 0, 0, null);

            return comprimirJpeg(escalada);
        } catch (Exception e) {
            log.warn("Error al reescalar imagen, se envía sin modificar: {}", e.getMessage());
            return original;
        }
    }

    private byte[] comprimirJpeg(BufferedImage imagen) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        ImageWriter writer = writers.next();
        ImageWriteParam params = writer.getDefaultWriteParam();
        params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        params.setCompressionQuality(CALIDAD_JPEG);

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(salida)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(imagen, null, null), params);
        } finally {
            writer.dispose();
        }
        return salida.toByteArray();
    }

    public void eliminarObjeto(String s3Key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build());
            log.info("Objeto eliminado de S3: {}", s3Key);
        } catch (Exception e) {
            log.error("Error al eliminar objeto de S3 (key={}): {}", s3Key, e.getMessage());
        }
    }
}
