package com.example.sigac.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private Long id;
    private String timestamp;
    private Long userId;
    private String userEmail;
    private String userRole;
    private String action;
    private String resource;
    private Long resourceId;
    private String previousValue;
    private String newValue;
    private String ipAddress;
    private String userAgent;
    private String metadata;
}