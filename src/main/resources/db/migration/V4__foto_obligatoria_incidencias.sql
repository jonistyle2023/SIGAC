-- ─────────────────────────────────────────────────────────────────────────────
-- Foto obligatoria como entrada principal del reporte: titulo/descripcion/
-- categoria pasan a ser opcionales; se agregan origen_reporte y
-- requiere_revision_manual para clasificación IA multimodal.
-- No se toca la nullability de latitud/longitud a nivel de columna todavía:
-- se desconoce el estado de datos existentes en producción y el deploy está
-- pausado. La obligatoriedad de coordenadas para incidencias nuevas se aplica
-- en la capa de validación de la aplicación.
--
-- Las ADD COLUMN usan el patrón INFORMATION_SCHEMA + SQL dinámico en vez de
-- "ADD COLUMN IF NOT EXISTS": esa cláusula no es soportada por todas las
-- versiones/distribuciones de MySQL (falla con error de sintaxis 1064 en
-- MySQL Community Server 9.2), así que se evita para máxima compatibilidad.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE incidencias MODIFY COLUMN titulo VARCHAR(200) NULL;
ALTER TABLE incidencias MODIFY COLUMN descripcion TEXT NULL;
ALTER TABLE incidencias MODIFY COLUMN categoria ENUM('INFRAESTRUCTURA','SEGURIDAD','SERVICIOS_PUBLICOS','MEDIO_AMBIENTE','OTRO') NULL;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incidencias' AND COLUMN_NAME = 'origen_reporte'
);
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE incidencias ADD COLUMN origen_reporte VARCHAR(30) NULL AFTER ia_razon_rechazo',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incidencias' AND COLUMN_NAME = 'requiere_revision_manual'
);
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE incidencias ADD COLUMN requiere_revision_manual BOOLEAN NOT NULL DEFAULT FALSE AFTER origen_reporte',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Datos existentes: título/descripción/categoría ya poblados por definición.
UPDATE incidencias SET origen_reporte = 'FOTO_CON_DETALLES' WHERE origen_reporte IS NULL;
