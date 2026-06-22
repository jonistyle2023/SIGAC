# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -q

COPY src/ src/
RUN ./mvnw clean package -DskipTests -q

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S sigac && adduser -S sigac -G sigac
USER sigac

COPY --from=builder /build/target/SIGAC-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]