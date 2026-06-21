-- ─────────────────────────────────────────────────────────────────────────────
-- Módulo 5: Entidades (debe ir antes que usuarios por la FK)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entidades (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    nombre           VARCHAR(150) NOT NULL,
    tipo             ENUM('BOMBEROS','POLICIA','TRANSITO','AMBULANCIA','MEDIO_AMBIENTE','OTRO') NOT NULL,
    descripcion      VARCHAR(500) NULL,
    telefono         VARCHAR(20)  NULL,
    email_contacto   VARCHAR(255) NULL,
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME  NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY UK_entidad_nombre (nombre)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla principal de usuarios
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    cedula             VARCHAR(20)  NULL UNIQUE,
    email              VARCHAR(255) NOT NULL UNIQUE,
    nombre             VARCHAR(100) NOT NULL,
    apellido           VARCHAR(100),
    password           VARCHAR(255) NOT NULL,
    rol                ENUM('CIUDADANO', 'ADMINISTRADOR', 'ENTIDAD_PUBLICA') NOT NULL,
    activo             BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verificado   BOOLEAN      NOT NULL DEFAULT FALSE,
    telefono           VARCHAR(20),
    direccion          VARCHAR(500),
    fecha_creacion     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP   ON UPDATE CURRENT_TIMESTAMP,
    ultimo_acceso      TIMESTAMP    NULL,
    entidad_id         BIGINT       NULL,
    PRIMARY KEY (id),
    CONSTRAINT UK_email   UNIQUE (email),
    CONSTRAINT UK_cedula  UNIQUE (cedula),
    CONSTRAINT FK_usuario_entidad FOREIGN KEY (entidad_id) REFERENCES entidades(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla de incidencias
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidencias (
    id                   BIGINT        NOT NULL AUTO_INCREMENT,
    titulo               VARCHAR(200)  NOT NULL,
    descripcion          TEXT          NOT NULL,
    categoria            ENUM('INFRAESTRUCTURA','SEGURIDAD','SERVICIOS_PUBLICOS','MEDIO_AMBIENTE','OTRO') NOT NULL,
    estado               ENUM('PENDIENTE','EN_REVISION','EN_PROCESO','RESUELTO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    prioridad            ENUM('BAJA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA',
    ciudadano_id         BIGINT        NOT NULL,
    entidad_asignada_id  BIGINT        NULL,   -- referencia a entidades(id)
    latitud              DECIMAL(10,8) NULL,
    longitud             DECIMAL(11,8) NULL,
    direccion_referencia VARCHAR(500)  NULL,
    fecha_creacion       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
    fecha_resolucion     DATETIME      NULL,
    ia_clasificado       BOOLEAN       NOT NULL DEFAULT FALSE,
    ia_categoria         VARCHAR(50)   NULL,
    ia_prioridad         VARCHAR(20)   NULL,
    ia_confianza         DECIMAL(4,3)  NULL,
    ia_resumen           VARCHAR(500)  NULL,
    ia_razon_rechazo     VARCHAR(500)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT FK_incidencia_ciudadano      FOREIGN KEY (ciudadano_id)        REFERENCES usuarios(id),
    CONSTRAINT FK_incidencia_entidad        FOREIGN KEY (entidad_asignada_id) REFERENCES entidades(id),
    INDEX idx_incidencia_ciudadano  (ciudadano_id),
    INDEX idx_incidencia_entidad    (entidad_asignada_id),
    INDEX idx_incidencia_estado     (estado),
    INDEX idx_incidencia_categoria  (categoria),
    INDEX idx_incidencia_fecha      (fecha_creacion)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Archivos multimedia de incidencias (almacenados en S3, aquí solo la key)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidencia_multimedia (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    incidencia_id   BIGINT       NOT NULL,
    s3_key          VARCHAR(500) NOT NULL,
    nombre_original VARCHAR(255) NULL,
    tipo_contenido  VARCHAR(100) NULL,
    tamano_bytes    BIGINT       NULL,
    orden           INT          NOT NULL DEFAULT 0,
    fecha_subida    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT FK_multimedia_incidencia FOREIGN KEY (incidencia_id) REFERENCES incidencias(id) ON DELETE CASCADE,
    INDEX idx_multimedia_incidencia (incidencia_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla de auditoría (append-only: sin UPDATE ni DELETE en producción)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    timestamp        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id          BIGINT        NULL,
    user_email       VARCHAR(255)  NULL,
    user_role        VARCHAR(50)   NULL,
    action           VARCHAR(100)  NOT NULL,
    resource         VARCHAR(100)  NOT NULL,
    resource_id      BIGINT        NULL,
    previous_value   TEXT          NULL,
    new_value        TEXT          NULL,
    ip_address       VARCHAR(45)   NULL,
    user_agent       TEXT          NULL,
    metadata         TEXT          NULL,
    PRIMARY KEY (id),
    INDEX idx_audit_user_id   (user_id),
    INDEX idx_audit_action    (action),
    INDEX idx_audit_resource  (resource, resource_id),
    INDEX idx_audit_timestamp (timestamp)
);