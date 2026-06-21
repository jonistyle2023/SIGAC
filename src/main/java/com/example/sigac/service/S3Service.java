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

import java.time.Duration;
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
