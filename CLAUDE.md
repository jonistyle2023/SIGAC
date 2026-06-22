# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SIGAC** (Sistema de Gestión de Incidencias Integrado con IA) is a citizen incident-reporting platform. Citizens submit incidents; public entities manage and track them. AI classification is planned for a future phase.

The repo contains two independent sub-projects:
- **Backend**: Java 21 / Spring Boot 3.x in `src/`
- **Frontend**: React 19 / Vite in `react-app/`

## Commands

### Backend (Maven)

```bash
# Run the dev server (H2 in-memory DB, port 8080)
./mvnw spring-boot:run

# Build (skip tests)
./mvnw clean package -DskipTests

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=SigacApplicationTests

# Use Java 23 compiler features
./mvnw clean install -Pjdk23
```

The app requires `DB_URL`, `DB_USER`, and `DB_PASS` environment variables for MySQL. In dev, H2 is used automatically (see `spring.datasource` in `application.properties`).

### Frontend (npm / Vite)

```bash
cd react-app
npm install
npm run dev      # starts at http://localhost:5173
npm run build
npm run lint
npm run preview  # preview the production build
```

## Architecture

### Backend (`src/main/java/com/example/sigac/`)

Layered Spring Boot app:

| Layer | Package | Responsibility |
|---|---|---|
| Controller | `controller/` | HTTP endpoints, request validation |
| Service | `service/` | Business logic |
| Repository | `repository/` | Spring Data JPA queries |
| Model | `model/` | JPA entities (`Usuario`, `Role` enum) |
| DTO | `dto/` | Request/Response objects (never expose entities directly) |
| Security | `security/` | JWT filter, `UserDetailsService` |
| Config | `config/` | `SecurityConfig` (CORS, RBAC, stateless sessions) |
| Exception | `exception/` | `GlobalExceptionHandler` for uniform error responses |

**Auth flow**: `JwtAuthenticationFilter` extracts the Bearer token per request → `JwtTokenProvider` validates it → sets `SecurityContext`. All endpoints under `/api/auth/**` are public except admin-registration routes, which require `ADMINISTRADOR` role.

**Roles** (`Role` enum): `CIUDADANO`, `ADMINISTRADOR`, `ENTIDAD_PUBLICA`. Role-based access is enforced via `@PreAuthorize` annotations. Admin count is capped at 3 at the service level.

**JWT**: HS512, 24-hour expiration, secret externalized to `application.properties`.

### Frontend (`react-app/src/`)

```
pages/        Landing, Login, Register, Welcome (protected dashboard)
context/      AuthContext — global auth state (user, token, login/logout)
services/     api.js (Axios instance + JWT request interceptor)
              auth.service.js (login/register calls)
App.jsx       Route definitions; protected route wrapper
```

`AuthContext` is the single source of truth for auth state. The Axios instance in `services/api.js` auto-attaches the JWT from context to every request.

CORS is pre-configured for `localhost:5173` (React dev) and `localhost:3000` (mobile).

### Database

Single table `usuarios` for this phase. Schema file was previously at `src/main/resources/schema.sql` and seed data at `data-dev.sql` (both deleted in current git state — H2 auto-creates schema from JPA in dev mode via `spring.jpa.hibernate.ddl-auto`).

### Modules — implementation status

- **Auth & User Management** — implemented
- **Incident Management** — not yet implemented (core next phase)
- **AI Classification** — planned (image/text analysis)
- **Assignment & Dispatch**, **Audit Trail**, **Notifications** — planned