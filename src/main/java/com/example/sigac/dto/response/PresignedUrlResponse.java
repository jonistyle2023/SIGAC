package com.example.sigac.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PresignedUrlResponse {
    private String presignedUrl;
    private String s3Key;
    private int expiresInMinutes;
}
