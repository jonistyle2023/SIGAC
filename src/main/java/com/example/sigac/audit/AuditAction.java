package com.example.sigac.audit;

public enum AuditAction {

    // Módulo 1: Autenticación
    LOGIN,
    REGISTER_CIUDADANO,
    REGISTER_ADMINISTRADOR,
    REGISTER_ENTIDAD_PUBLICA,

    // Módulo 2: Gestión de usuarios
    USER_UPDATE,
    USER_ROLE_CHANGE,
    USER_ACTIVATE,
    USER_DEACTIVATE,
    PASSWORD_CHANGE,

    // Módulo 3: Incidencias (reservado)
    INCIDENT_CREATE,
    INCIDENT_UPDATE,
    INCIDENT_STATUS_CHANGE,
    INCIDENT_DELETE,

    // Módulo 4: Clasificación IA
    INCIDENT_AI_CLASSIFIED,

    // Módulo 5: Asignación (reservado)
    INCIDENT_ASSIGN,

    // Módulo 7: Reportería (reservado)
    REPORT_EXPORT
}
