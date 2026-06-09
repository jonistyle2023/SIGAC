# SIGAC

Sistema de Gestión de Incidencias Integrado con IA.

SIGAC es una plataforma web y móvil para que los ciudadanos reporten incidencias y las entidades públicas puedan clasificarlas, gestionarlas y darles seguimiento. El proyecto incluye autenticación, control de roles, trazabilidad y módulos orientados a la atención de casos urbanos.

## Tecnologías

- **Backend:** Spring Boot 3.5.14, Java 21, Spring Security, Spring Data JPA, JWT
- **Base de datos:** MySQL en producción
- **Frontend:** React 19, Vite, Tailwind CSS

## Ejecución local

### Backend
```bash
./mvnw spring-boot:run
```

### Frontend
```bash
cd react-app
npm install
npm run dev
```

## Documentación

La planificación general y el módulo de autenticación están en la carpeta `Doc/`.
