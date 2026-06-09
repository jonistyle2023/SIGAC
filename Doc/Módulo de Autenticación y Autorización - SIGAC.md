---
date: 2026-05-25T18:38
tags: []
---
## Descripción  
Este módulo proporciona funcionalidades completas de autenticación y autorización para el sistema SIGAC, incluyendo:  
- Registro de ciudadanos  
- Login con JWT  
- Control de Roles (RBAC)  
- Gestión de usuarios administrativos  
- Seguridad con Spring Security  
  
## Roles del Sistema  
1. **CIUDADANO**: Pueden auto-registrarse con su cédula  
2. **ADMINISTRADOR**: Máximo 3, registrados por otro administrador  
3. **ENTIDAD_PUBLICA**: Registrados únicamente por administrador  
  
## Configuración Inicial  
  
### Base de Datos  
Asegúrese de que la base de datos MySQL esté corriendo y configurada en `application.properties`:  
```properties  
spring.datasource.url=jdbc:mysql://localhost:3306/sigac  
spring.datasource.username=root  
spring.datasource.password=  
```  
  
### Estructura de la Base de Datos  
La tabla `usuarios` se crea automáticamente con las siguientes columnas:  
- `id` (PRIMARY KEY)  
- `cedula` (UNIQUE, NOT NULL)  
- `email` (UNIQUE, NOT NULL)  
- `nombre` (NOT NULL)  
- `apellido`  
- `password` (NOT NULL, encriptada con BCrypt)  
- `rol` (ENUM: CIUDADANO, ADMINISTRADOR, ENTIDAD_PUBLICA)  
- `activo` (BOOLEAN, DEFAULT: true)  
- `email_verificado` (BOOLEAN, DEFAULT: false)  
- `telefono`  
- `direccion`  
- `fecha_creacion` (TIMESTAMP)  
- `fecha_actualizacion` (TIMESTAMP)  
- `ultimo_acceso` (TIMESTAMP)  
  
## Endpoints de Autenticación  
  
### 1. Registro de Ciudadano  
**POST** `/api/auth/register`  
  
**Body:**  
```json  
{  
  "cedula": "0928622471",
  "email": "jonathanpan22@gmail.com",
  "nombre": "Jonathan",
  "apellido": "Panchana",
  "password": "Di mi nombre 22.",
  "confirmPassword": "Di mi nombre 22.",
  "telefono": "0999242751",
  "direccion": "Amantes de Sumpa, Jaime Roldes y Z1"
}  
```  
  
**Validaciones:**  
- Cédula: Solo números (6-20 dígitos)  
- Email: Formato válido  
- Nombre: 2-100 caracteres  
- Contraseña: Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas, números y caracteres especiales  
- Las contraseñas deben coincidir  
  
**Response (201 Created):**  
```json  
{  
  "token": "eyJhbGciOiJIUzUxMiJ9...",  "tipo": "Bearer",  "id": 1,  "email": "ciudadano@example.com",  "nombre": "Juan",  "rol": "CIUDADANO",  "exito": true,  "mensaje": "Usuario registrado exitosamente"}  
```  
  
### 2. Login  
**POST** `/api/auth/login`  
  
**Body:**  
```json  
{  
  "email": "jonathanpan22@gmail.com",
  "password": "Di mi nombre 22."
}  
```  
  
**Response (200 OK):**  
```json  
{  
  "token": "eyJhbGciOiJIUzUxMiJ9...",  "tipo": "Bearer",  "id": 1,  "email": "ciudadano@example.com",  "nombre": "Juan",  "rol": "CIUDADANO",  "exito": true,  "mensaje": "Login exitoso"}  
```  
  
### 3. Registrar Administrador (Solo Administrador)  
**POST** `/api/auth/register-admin`  
  
**Headers:**  
```  
Authorization: Bearer {token}  
```  
  
**Body:**  
```json  
{  
  "cedula": "0987654321",  "email": "admin@example.com",  "nombre": "Admin",  "apellido": "Sistema",  "password": "AdminPass123!",  "confirmPassword": "AdminPass123!",  "telefono": "+57 987 6543210"}  
```  
  
**Validaciones:**  
- Solo administradores pueden registrar otros administradores  
- Máximo 3 administradores en el sistema  
  
**Response (201 Created):**  
```json  
{  
  "exito": true,  "mensaje": "Administrador registrado exitosamente"}  
```  
  
### 4. Registrar Entidad Pública (Solo Administrador)  
**POST** `/api/auth/register-entidad`  
  
**Headers:**  
```  
Authorization: Bearer {token}  
```  
  
**Body:**  
```json  
{  
  "cedula": "1111111111",  "email": "entidad@example.com",  "nombre": "Municipio de Bogotá",  "apellido": "Infraestructura",  "password": "EntidadPass123!",  "confirmPassword": "EntidadPass123!",  "telefono": "+57 111 1111111",  "direccion": "Carrera 7 #32-16"}  
```  
  
**Response (201 Created):**  
```json  
{  
  "exito": true,  "mensaje": "Entidad pública registrada exitosamente"}  
```  
  
### 5. Validar Token  
**POST** `/api/auth/validate-token`  
  
**Headers:**  
```  
Authorization: Bearer {token}  
```  
  
**Response (200 OK):**  
```json  
{  
  "exito": true,  "mensaje": "Token válido"}  
```  
  
## Endpoints de Usuario  
  
### 1. Obtener Perfil del Usuario Autenticado  
**GET** `/api/usuarios/perfil`  
  
**Headers:**  
```  
Authorization: Bearer {token}  
```  
  
**Response (200 OK):**  
```json  
{  
  "id": 1,  "cedula": "1234567890",  "email": "ciudadano@example.com",  "nombre": "Juan",  "apellido": "Pérez",  "rol": "CIUDADANO",  "activo": true,  "emailVerificado": false,  "telefono": "+57 123 4567890",  "direccion": "Calle 1 #2-3",  "fechaCreacion": "2024-05-25T10:30:00"}  
```  
  
### 2. Obtener Usuario por ID (Solo Administrador)  
**GET** `/api/usuarios/{id}`  
  
**Headers:**  
```  
Authorization: Bearer {token_admin}  
```  
  
**Response (200 OK):**  
```json  
{  
  "id": 1,  "cedula": "1234567890",  "email": "ciudadano@example.com",  "nombre": "Juan",  "apellido": "Pérez",  "rol": "CIUDADANO",  "activo": true,  "emailVerificado": false,  "telefono": "+57 123 4567890",  "direccion": "Calle 1 #2-3",  "fechaCreacion": "2024-05-25T10:30:00"}  
```  
  
### 3. Obtener Usuario por Email (Solo Administrador)  
**GET** `/api/usuarios/email/{email}`  
  
**Headers:**  
```  
Authorization: Bearer {token_admin}  
```  
  
**Response (200 OK):**  
```json  
{  
  "id": 1,  "cedula": "1234567890",  "email": "ciudadano@example.com",  "nombre": "Juan",  "apellido": "Pérez",  "rol": "CIUDADANO",  "activo": true,  "emailVerificado": false,  "telefono": "+57 123 4567890",  "direccion": "Calle 1 #2-3",  "fechaCreacion": "2024-05-25T10:30:00"}  
```  
  
### 4. Obtener Todos los Usuarios (Solo Administrador)  
**GET** `/api/usuarios`  
  
**Headers:**  
```  
Authorization: Bearer {token_admin}  
```  
  
**Response (200 OK):**  
```json  
[  
  {    "id": 1,    "cedula": "1234567890",    "email": "ciudadano@example.com",    "nombre": "Juan",    "apellido": "Pérez",    "rol": "CIUDADANO",    "activo": true,    "emailVerificado": false,    "telefono": "+57 123 4567890",    "direccion": "Calle 1 #2-3",    "fechaCreacion": "2024-05-25T10:30:00"  }]  
```  
  
### 5. Obtener Todos los Usuarios Activos (Solo Administrador)  
**GET** `/api/usuarios/filtro/activos`  
  
**Headers:**  
```  
Authorization: Bearer {token_admin}  
```  
  
**Response (200 OK):**  
```json  
[  
  {    "id": 1,    "cedula": "1234567890",    "email": "ciudadano@example.com",    "nombre": "Juan",    "apellido": "Pérez",    "rol": "CIUDADANO",    "activo": true,    "emailVerificado": false,    "telefono": "+57 123 4567890",    "direccion": "Calle 1 #2-3",    "fechaCreacion": "2024-05-25T10:30:00"  }]  
```  
  
### 6. Desactivar Usuario (Solo Administrador)  
**PUT** `/api/usuarios/{id}/desactivar`  
  
**Headers:**  
```  
Authorization: Bearer {token_admin}  
```  
  
**Response (200 OK):**  
```  
Usuario desactivado exitosamente  
```  
  
### 7. Activar Usuario (Solo Administrador)  
**PUT** `/api/usuarios/{id}/activar`  
  
**Headers:**  
```  
Authorization: Bearer {token_admin}  
```  
  
**Response (200 OK):**  
```  
Usuario activado exitosamente  
```  
  
## Seguridad  
  
### Encriptación de Contraseñas  
- Se utiliza BCrypt para encriptar las contraseñas  
- Fuerza: 10 (predeterminada)  
  
### Tokens JWT  
- Algoritmo: HS512  
- Expiración: 24 horas (86400000 ms)  
- Se envía en el header `Authorization: Bearer {token}`  
  
### Control de Acceso (RBAC)  
- Cada endpoint requiere roles específicos  
- Los roles se verifican mediante anotaciones `@PreAuthorize`  
- Los filtros de seguridad validan el token antes de procesar la solicitud  
  
## Códigos de Error  
  
| Código | Descripción |  
|--------|-------------|  
| 201 | Recurso creado exitosamente |  
| 200 | Solicitud exitosa |  
| 400 | Error de validación o solicitud inválida |  
| 401 | No autorizado (credenciales inválidas o token expirado) |  
| 404 | Recurso no encontrado |  
| 409 | Conflicto (ej: límite de administradores alcanzado) |  
| 500 | Error interno del servidor |  
  
## Ejemplo de Uso con Postman  
  
### 1. Registrar un Ciudadano  
```  
POST http://localhost:8080/api/auth/register  
Content-Type: application/json  
  
{  
  "cedula": "1234567890",  "email": "ciudadano@example.com",  "nombre": "Juan",  "apellido": "Pérez",  "password": "Contraseña123!",  "confirmPassword": "Contraseña123!",  "telefono": "+57 123 4567890",  "direccion": "Calle 1 #2-3"}  
```  
  
### 2. Login  
```  
POST http://localhost:8080/api/auth/login  
Content-Type: application/json  
  
{  
  "email": "ciudadano@example.com",  "password": "Contraseña123!"}  
```  
  
### 3. Obtener Perfil  
```  
GET http://localhost:8080/api/usuarios/perfil  
Authorization: Bearer {token_recibido}  
```  
  
## Notas Importantes  
  
1. **Primer Administrador**: El primer administrador debe ser registrado directamente en la base de datos o mediante un script especial.  
2. **Limitación de Administradores**: Solo puede haber un máximo de 3 administradores en el sistema.  
3. **Validación de Email**: Para producción, se should implementar verificación de email.  
4. **CORS**: Actualmente está habilitado para todas las fuentes. Para producción, configure en `application.properties`.  
5. **JWT Secret**: Cambiar el valor de `jwt.secret` en `application.properties` en producción.  
  
## Próximos Pasos  
  
1. Implementar verificación de email  
2. Agregar recuperación de contraseña  
3. Implementar 2FA (autenticación de dos factores)  
4. Crear auditoría de cambios de usuario  
5. Implementar refresh tokens