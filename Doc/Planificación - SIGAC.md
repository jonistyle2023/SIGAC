---
date: 2026-05-14T16:04
tags:
  - projects
---
# Progreso
---
Roles necesarios para el desarrollo:
- Analista
- Diseñador
- Arquitecto de software
- Desarrollador
- Tester de calidad

>[!Example] Planificación y Análisis
>**Objetivo:** Definir el alcance, necesidades del negocio y requerimientos del sistema
>>[!todo] Tareas
>>- [ ] Identificación de stakeholders
>>- [ ] Definición del alcance del sistema (MVP)
>>- [ ] Identificación de riesgos del proyecto
>>- [ ] Definición de criterios de éxito
>>- [ ] Diagrama de Contexto
>>- [ ] Procesos
>>- [ ] Necesidades Generales
>>- [ ] Necesidades / Requisitos de Usuario
>>- [ ] Requisitos Funcionales
>>- [ ] Requisitos No Funcionales
>
>>[!tip] Roles involucrados
>>- Analista
>>- Arquitecto de Software

>[!Example] Diseño
>**Objetivo:** Definir cómo se construirá el sistema a nivel funcional y técnico.
>>[!todo] Tareas
>>- [ ] Diagramas de Casos de Uso
>>- [ ] Diagrama de Actividad
>>- [ ] Diagrama de Secuencia
>>- [ ] Tarjetas CRC
>>- [ ] Vista Lógica - Diagrama de Clases
>>- [ ] Vista de Desarrollo - Diagrama de componentes
>>- [ ] Vista Física - Diagrama de despliegue
>>- [ ] Diagrama Entidad - Relación
>>- [ ] Diseño de la arquitectura del sistema
>>- [ ] Diseño de interfaces (UX/UI)
>>- [ ] Selección de tecnologías
>
>>[!tip] Roles involucrados
>>- Arquitecto de software
>>- Diseñador
>>- Analista

>[!Example] Desarrollo
>**Objetivo:** Construir el sistema según los diseños definidos
>>[!todo] Tareas
>>- [ ] Configuración del entorno de desarrollo
>>- [ ] Desarrollo del backend (API, lógica de negocio)
>>- [ ] Desarrollo del frontend (web y/o móvil)
>>- [ ] Implementación de módulos
>>- [ ] Integración con AWS
>>- [ ] Control de versiones - desarrollo (develop o dev), preproducción (staging, preprod o test) y producción (main o master)
>
>>[!tip] Roles involucrados
>>- Desarrollador
>>- Arquitecto de software

>[!Example] Pruebas
>**Objetivo:** Validar que el sistema funcione correctamente y cumpla los requerimientos
>>[!todo] Tareas
>>- [ ] Diseño de casos de prueba
>>- [ ] Pruebas funcionales
>>- [ ] Pruebas de integración
>>- [ ] Pruebas de usabilidad
>>- [ ] Pruebas de rendimiento (básicas)
>>- [ ] Registro y seguimiento de errores
>
>>[!tip] Roles involucrados
>>- Tester de calidad
>>- Desarrollador

>[!Example] Despliegue
>**Objetivo:** Poner el sistema en producción para su uso real.
>>[!todo] Tareas
>>- [ ] Configuración del entorno productivo
>>- [ ] Despliegue de la aplicación
>>- [ ] Configuración de base de datos
>>- [ ] Configuración de servicios en la nube (AWS)
>>- [ ] Pruebas post-despliegue
>>- [ ] Capacitación básica a usuarios
>
>>[!tip] Roles involucrados
>>- Arquitecto de software
>>- Desarrollador

>[!Example] Mantenimiento
>**Objetivo:** Asegurar el correcto funcionamiento del sistema en el tiempo.
>>[!todo] Tareas
>>- [ ] Corrección de errores
>>- [ ] Monitoreo del sistema
>>- [ ] Optimización de rendimiento
>>- [ ] Actualizaciones del sistema
>>- [ ] Soporte a usuarios
>>- [ ] Mejora continua (nuevas funcionalidades)
>
>>[!tip] Roles involucrados
>>- Desarrollador
>>- Tester de calidad
>>- Arquitecto de software

# Detalles iniciales del proyecto
-----

**Nombre del proyecto:** 
	Sistema de gestión de incidencias integrado con IA (SIGAC) O algo así.

**Metodología Seleccionada:**
	- Scrum

## Descripción del producto

El presente proyecto consiste en el desarrollo de un sistema digital para la gestión de incidencias ciudadanas, orientado a entidades públicas. Su propósito es facilitar la comunicación entre los ciudadanos y las instituciones gubernamentales, permitiendo reportar, gestionar y dar seguimiento a problemas en el entorno urbano, tales como daños en infraestructura, acumulación de residuos, fallas en servicios públicos, entre otros.

El sistema estará compuesto por una plataforma web y una aplicación móvil, mediante las cuales los ciudadanos podrán registrar incidencias de forma sencilla, incluyendo evidencia como imágenes y descripciones. A su vez, las entidades públicas contarán con herramientas para la gestión, clasificación, seguimiento y resolución de dichas incidencias.

## Tipo de Software

- Aplicación web (para administración y gestión institucional)
- Aplicación móvil (para uso ciudadano)

## Usuarios Principales

- **Ciudadanos:** encargados de reportar incidencias y consultar su estado.
- **Funcionarios públicos:** responsables de gestionar, atender y resolver incidencias.
- **Administradores del sistema:** encargados de la supervisión, control, auditoría y configuración del sistema.

## Funcionalidad General

El sistema permitirá a los ciudadanos registrar incidencias mediante el envío de imágenes y descripciones, las cuales serán procesadas y clasificadas automáticamente para su correcta asignación. Las entidades públicas podrán gestionar estas incidencias a través de un panel administrativo, donde podrán dar seguimiento a cada caso, actualizar su estado y registrar las acciones realizadas.

Asimismo, el sistema incorporará mecanismos de trazabilidad que permitirán registrar todas las acciones realizadas por los usuarios, garantizando transparencia y control en la gestión. También se contemplan funcionalidades de consulta, notificación y generación de reportes.

## Beneficios Esperados

- Mejora en la eficiencia de la gestión de incidencias ciudadanas.
- Reducción de tiempos de respuesta por parte de las entidades públicas.
- Mayor transparencia y control en los procesos internos.
- Fortalecimiento de la confianza entre ciudadanos y gobierno.
- Apoyo en la toma de decisiones mediante información centralizada y trazable.

## Alcance Inicial del Producto

En su primera versión, el sistema permitirá:

- Registro de incidencias por parte de ciudadanos.
- Carga de imágenes como evidencia.
- Clasificación inicial de incidencias.
- Asignación y gestión de incidencias por parte de funcionarios.
- Seguimiento del estado de cada incidencia.
- Registro de actividades (trazabilidad) para auditoría.
- Generación básica de reportes administrativos.

>[!danger] No se contempla en esta etapa inicial la integración con otros sistemas gubernamentales ni el desarrollo de funcionalidades avanzadas de analítica, las cuales podrán considerarse en fases futuras del proyecto.

# Módulos del Sistema
---
## **1. Módulo de Autenticación y Autorización**
- Login (correo, redes sociales)
- JWT / sesiones
- Control de roles (RBAC)
- Seguridad

## **2. Módulo de Gestión de usuarios**
- CRUD de usuarios
- Asignación de roles (Admin, Entidad, Ciudadano)
- Activación / desactivación

## **3. Módulo de Gestión de Incidencias (CORE)**
- Crear incidencia
- Adjuntar multimedia (imagen, ~~video~~, ~~audio~~)
- Geolocalización
- Estado (Pendiente, en proceso, resuelto)
- ~~Historial~~

## **4. Módulo de Clasificación con IA**

**Principales:**
- Clasificación automática (gravedad 1-4)
	**Servicios Recomendados:**
	- Imagen → Rekognition
	- Texto → Comprehend
	- Lógica → Backend (Lambda)
	- Logs → tu módulo de trazabilidad
	- Resultado: Sistema inteligente + auditable + resistente a fraude

- Posible uso de NLP / visión computacional
- Ajuste manual por admin (importante)

### Clasificación de las incidencias
---
Para el sistema, la gravedad se mide por el riesgo a la seguridad pública, el daño ambiental y la afectación al libre tránsito.

La clasificación ideal se divide en cuatro niveles de gravedad:

#### 🔴 Gravedad 1: Emergencia Urbana (Crítica)

- Definición: Riesgo inminente para la vida, salud o seguridad de las personas.
- Impacto: Requiere intervención de equipos de rescate o cuadrillas de urgencia.
- Ejemplos:
    - Socavón profundo en avenida principal.
    - Árbol o poste de luz caído sobre cables de alta tensión.
    - Semáforos apagados en un cruce de alta velocidad.
    - Fuga masiva de agua potable o gas en la vía pública.

#### 🟡 Gravedad 2: Alta (Urgente)

- Definición: Afectación severa a los servicios públicos o bloqueos viales importantes.
- Impacto: Interrumpe la rutina de un sector, pero sin peligro mortal inmediato.
- Ejemplos:
    - Avería vial mayor (bache profundo que rompe neumáticos).
    - Semáforo dañado en intersección secundaria.
    - Acumulación de basura que bloquea una acera completa.
    - Alumbrado público completamente apagado en toda una calle.

#### 🔵 Gravedad 3: Media (Moderada)

- Definición: Desperfectos que causan molestia o mala imagen, sin frenar el entorno.
- Impacto: Afecta la estética o comodidad de los vecinos. Programable a mediano plazo.
- Ejemplos:
    - Exceso de basura o escombros en un contenedor (sin desbordar la vía).
    - Bache menor en calle residencial de baja velocidad.
    - Falta de tapa de alcantarilla en zona verde o parque (delimitada).
    - Plaga de insectos o roedores en un espacio público abierto.

#### 🟢 Gravedad 4: Baja (Planificable)

- Definición: Mantenimiento preventivo, mejoras visuales o peticiones ciudadanas.
- Impacto: No altera el orden, la salud ni el tránsito de la ciudad.
- Ejemplos:
    - Grafitis en paredes públicas o mobiliario urbano.
    - Papelera de parque rota o sin bolsa.
    - Necesidad de poda de césped en rotondas.
    - Solicitud para pintar las líneas de un paso peatonal borroso.

## **5. Módulo de Asignación y Despacho**
- Asignar incidencia a entidad (Bomberos, Policía, etc.)
- Prioridad según gravedad
- ~~Gestión de recursos~~

## ~~6. Módulo de Notificaciones~~
- ~~Push (móvil)~~
- ~~Email~~
- ~~Estado entiempo real~~

## ~~7. Módulo de Reportería y Analítica~~
- ~~Exportar PDF, CSV y XLS~~
- ~~KPIs:~~
	- ~~Tiempo de resolución~~
	- ~~Incidencias por zona~~
	- ~~Tipo más frecuente~~

## ~~8. API Pública~~
- ~~Consulta de incidencias públicas~~
- ~~Transparencia ciudadana~~
- ~~Integración con otros sistemas~~

## ~~9. Módulo de Infraestructura / Cloud~~
~~*(No es funcional pero sí arquitectónico)*~~
- ~~Despliegue en AWS~~
- ~~Escalabilidad~~
- ~~Disponibilidad 24/7~~

## 10. Módulo de Auditoría y Trazabilidad (Audit Trail)

**Responsabilidad:**
	- Registrar TODAS las acciones críticas del sistema
	- Garantizar integridad de la información
	- Permitir auditorías internas y externas

**Como mínimo registrar:**

```json
{
  "timestamp": "2026-05-14T10:30:00Z",
  "user_id": 123,
  "role": "Entidad",
  "action": "UPDATE_INCIDENT_STATUS",
  "resource": "incident",
  "resource_id": 456,
  "previous_value": "En proceso",
  "new_value": "Resuelto",
  "ip_address": "192.168.1.10",
  "user_agent": "Chrome",
  "metadata": {
    "justification": "Resuelto en sitio"
  }
}
```

**Acciones que DEBE auditar Sí o sí:**
- Cambio de estado de incidencia
- Eliminación (si permite)
- Edición de incidencias
- Asignaciones
- Login/logout
- Cambio de roles
- Creación de usuarios
- Exportación de reportes

>[!danger] Punto Clave
>El log No debe ser alterado!
>En caso de alteración, un administrador puede borrar el log y listo.
>>[!success] Solución
>>- Base de datos separada solo de auditoría
>>- Solo escritura (append-only)
>>- Sin UPDATE ni DELETE

**Integración con los módulos:**

|Módulo|¿Genera auditoría?|
|---|---|
|Usuarios|✅|
|Incidencias|✅ (CRÍTICO)|
|IA|⚠️ (decisiones automáticas)|
|Asignación|✅|
|Reportería|✅|
|Autenticación|✅|

**Requerimientos opcionales**
**1. Doble validación para cierre de incidencias**
- Entidad marca como “resuelto”
- Pero queda en estado: “Pendiente de validación”
- Ciudadano o supervisor confirma

**2. Transparencia pública**
- Mostrar el historial de cambios (limitado) en API pública
- Ejemplos:
	- “Incidencia reportada”
	- “Asignada a Obras Públicas”
	- “En proceso”
	- “Resuelta”

# Actividades
---
- Registro de ciudadanos; Creación de entidades gestionada por administradores
- Registro de incidencias con soporte multimedia (imagen, video, audio)
- Geolocalización automática del incidente
- Clasificación automática mediante IA (con posibilidad de ajuste manual)
- Asignación automática o manual a entidades responsables
- Definición de SLA según nivel de gravedad
- Notificación en tiempo real del estado de la incidencia
- Seguimiento completo del ciclo de vida de la incidencia
- Escalamiento automático en caso de incumplimiento de tiempos
- Cierre de incidencias con validación por parte de la entidad
- Retroalimentación del ciudadano sobre la atención recibida
- Generación de reportes y analítica de desempeño

