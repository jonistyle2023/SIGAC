# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SIGAC** (Sistema de Gestión de Incidencias Integrado con IA) is a citizen incident-reporting platform. Citizens submit incidents; public entities manage and track them.

The repo contains two independent sub-projects:
- **Backend**: Java 21 / Spring Boot 3.x in `src/`
- **Frontend**: React 19 / Vite in `react-app/`

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production — every push auto-deploys to AWS via GitHub Actions |
| `develop` | Integration — PRs from feature branches merge here first |
| `feature/*` | New features |
| `hotfix/*` | Emergency production fixes |

**Always work on `develop` or a `feature/*` branch. Never commit directly to `main`.**

## Commands

### Backend (Maven)

```bash
# Run locally (H2 in-memory DB, no env vars needed)
./mvnw spring-boot:run -Dspring.profiles.active=dev

# Build (skip tests)
./mvnw clean package -DskipTests

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=SigacApplicationTests
```

The `dev` profile (`application-dev.properties`) uses H2 in-memory DB, disables Flyway, and provides hardcoded JWT/CORS values for local development. **Never run without `-Dspring.profiles.active=dev` locally** — the default profile requires `DB_URL`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, and `CORS_ALLOWED_ORIGINS` env vars (production only, set in AWS SSM Parameter Store).

### Frontend (npm / Vite)

```bash
cd react-app
npm install
npm run dev      # starts at http://localhost:5173
npm run build
npm run lint
npm run preview  # preview the production build
```

Local API URL is set in `react-app/.env` → `VITE_API_URL=http://localhost:8080/api`.

## Architecture

### Backend (`src/main/java/com/example/sigac/`)

Layered Spring Boot app:

| Layer | Package | Responsibility |
|---|---|---|
| Controller | `controller/` | HTTP endpoints, request validation |
| Service | `service/` | Business logic |
| Repository | `repository/` | Spring Data JPA queries |
| Model | `model/` | JPA entities |
| DTO | `dto/` | Request/Response objects (never expose entities directly) |
| Security | `security/` | JWT filter, `UserDetailsService` |
| Config | `config/` | `SecurityConfig` (CORS, RBAC, stateless sessions) |
| Exception | `exception/` | `GlobalExceptionHandler` for uniform error responses |

**Auth flow**: `JwtAuthenticationFilter` extracts the Bearer token per request → `JwtTokenProvider` validates it → sets `SecurityContext`. All endpoints under `/api/auth/**` are public except admin-registration routes, which require `ADMINISTRADOR` role.

**Roles** (`Role` enum): `CIUDADANO`, `ADMINISTRADOR` (max 3), `ENTIDAD_PUBLICA`. Role-based access enforced via `@PreAuthorize`.

**JWT**: HS512, 24-hour expiration. Secret from SSM in prod, hardcoded in `application-dev.properties` for local dev.

### Frontend (`react-app/src/`)

```
pages/        Landing, Login, Register, Welcome (protected dashboard)
context/      AuthContext — global auth state (user, token, login/logout)
services/     api.js (Axios instance + JWT request interceptor)
              auth.service.js, incidencia.service.js, usuario.service.js,
              entidad.service.js, audit.service.js
App.jsx       Route definitions; protected route wrapper
```

`AuthContext` is the single source of truth for auth state. The Axios instance in `services/api.js` auto-attaches the JWT from context to every request.

### Database

Managed by **Flyway** in production (`spring.flyway.enabled=true`). Migrations in `src/main/resources/db/migration/`:
- `V1__initial_schema.sql` — all tables (entidades, usuarios, incidencias, multimedia, audit_logs)
- `V2__fix_ia_confianza_column_type.sql` — fix ia_confianza DECIMAL→DOUBLE

In local dev, H2 auto-creates schema from JPA entities (`ddl-auto=create-drop`), Flyway is disabled.

**Production DB**: MySQL 8.4 on AWS RDS (`sigacdb` instance, `sigac` schema).

### Infrastructure (AWS)

| Component | Service |
|---|---|
| Frontend | S3 + CloudFront (`dih930xv8x8fd`) |
| Backend | ECS Fargate (`sigac-cluster`, `sigac-backend-service`) |
| Load Balancer | ALB (`sigac-alb`) → target group `sigac-backend-tg` |
| Database | RDS MySQL (`sigacdb.c4pqggsmcpp4.us-east-1.rds.amazonaws.com`) |
| Secrets | SSM Parameter Store (`/sigac/*`) |
| Container Registry | ECR |

CloudFront routes `/api/*` to the ALB (HTTP, port 80). All other paths serve the React SPA from S3.

### Modules — implementation status

- **Auth & User Management** — done
- **Incident Management** — done (CRUD, estado workflow, S3 multimedia)
- **Audit Trail** — done (`audit_logs`, admin only)
- **AI Classification** — done (Google Gemini, rule-based fallback)
- **Assignment & Dispatch** — done (`entidades` table, manual assignment)
- **Notifications** — not implemented
- **Reports / Export** — not implemented
