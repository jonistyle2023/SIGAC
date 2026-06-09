CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cedula VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    telefono VARCHAR(20),
    direccion VARCHAR(500),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NULL,
    ultimo_acceso TIMESTAMP NULL,
    CONSTRAINT PK_usuarios PRIMARY KEY (id),
    CONSTRAINT UK_usuarios_email UNIQUE (email),
    CONSTRAINT UK_usuarios_cedula UNIQUE (cedula)
);
