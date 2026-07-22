-- ─────────────────────────────────────────────────────────────────────────────
-- Módulo 6: Notificaciones (canal in-app)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    usuario_id     BIGINT       NOT NULL,
    tipo           ENUM('CAMBIO_ESTADO','ASIGNACION') NOT NULL,
    titulo         VARCHAR(200) NOT NULL,
    mensaje        VARCHAR(500) NOT NULL,
    incidencia_id  BIGINT       NULL,
    leida          BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_creacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura  DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT FK_notificacion_usuario    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)    ON DELETE CASCADE,
    CONSTRAINT FK_notificacion_incidencia FOREIGN KEY (incidencia_id) REFERENCES incidencias(id) ON DELETE CASCADE,
    INDEX idx_notificacion_usuario       (usuario_id),
    INDEX idx_notificacion_usuario_leida (usuario_id, leida),
    INDEX idx_notificacion_fecha         (fecha_creacion)
);
