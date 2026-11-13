<p align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<h1 align="center">ERP Backend</h1>

<p align="center">
  API REST y WebSocket para el sistema ERP, desarrollada con NestJS, TypeScript y PostgreSQL.
</p>

---

## Contenido

- [Documentación](#documentación)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Ejecución](#ejecución)
- [Datos iniciales (Seed)](#datos-iniciales-seed)
- [Convenciones de la API](#convenciones-de-la-api)
- [Módulos y endpoints](#módulos-y-endpoints)
- [WebSockets](#websockets)
- [Ejecución con Docker](#ejecución-con-docker)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Solución de problemas](#solución-de-problemas)
- [Licencia](#licencia)

## Documentación

- Guía de integración para el frontend: [`docs/API-FRONTEND.md`](docs/API-FRONTEND.md)
- Plan del chat por WebSocket: [`docs/PLAN-WEBSOCKET-CHAT.md`](docs/PLAN-WEBSOCKET-CHAT.md)
- Swagger interactivo (con el backend levantado): <http://localhost:9000/api/docs>

La guía del frontend contiene el catálogo completo de endpoints, payloads de ejemplo, flujo de autenticación, paginación, permisos y recetas de integración.

## Requisitos

- **Node.js 22 o superior** (la imagen Docker usa `node:22-alpine`)
- **pnpm 10 o superior** (el proyecto usa `pnpm-lock.yaml`)
- **PostgreSQL 18 o superior** (requerido por las migraciones de UUID v7)
- Docker y Docker Compose (opcional, para levantar la base de datos y la aplicación)

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/IvanhLopez23/ERP-backend.git
cd ERP-backend
```

Instalar dependencias:

```bash
pnpm install
```

## Configuración

Crear un archivo `.env` en la raíz del proyecto. Ejemplo:

```env
# Servidor
PORT=9000
NODE_ENV=development

# Base de datos
DB_NAME=erp
DB_USERNAME=desarrollo
DB_PASSWORD=desarrollo
DB_HOST=localhost
DB_PORT=5432

# JWT y sesiones
JWT_SECRET=MiClaveSecretaSuperSeguraParaPruebasNest123!
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
PASSWORD_RESET_EXPIRES_IN=1h
WS_TICKET_TTL=60

# CORS (lista separada por comas)
CORS_ORIGINS=http://localhost:3000,http://localhost:4200

# Correo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

# URL del frontend (usada en correos y enlaces)
APP_URL=http://localhost:4200

# Branding / datos de la empresa
COMPANY_NAME=ERP
COMPANY_EMAIL=erp@erp.com
COMPANY_PHONE=8181818181
COMPANY_ADDRESS=
COMPANY_WEBSITE=
COMPANY_LOGO=

# Seed de desarrollo
DEVELOPMENT_SEED_KEY=dev-seed-2026
```

> `NODE_ENV=development` es obligatorio para habilitar `POST /api/seed/desarrollo`. En producción ese endpoint responde `403`.

## Base de datos y migraciones

La aplicación **no usa `synchronize`**: el esquema se controla exclusivamente con migraciones de TypeORM. Antes de aplicarlas, respaldar la base de datos.

```bash
# Ver estado de las migraciones
pnpm run migration:show

# Aplicar migraciones pendientes
pnpm run migration:run

# Revertir la última migración
pnpm run migration:revert

# Generar una nueva migración a partir de los cambios en entidades
pnpm run migration:generate
```

Las migraciones están en `src/core/database/migrations/`. Los UUID v7 (`public_id`) requieren **PostgreSQL 18 o superior**.

## Ejecución

### Modo desarrollo (recarga automática)

```bash
pnpm run start:dev
```

### Modo desarrollo sin watch

```bash
pnpm run start
```

### Modo debug

```bash
pnpm run start:debug
```

### Modo producción

```bash
pnpm run build
pnpm run start:prod
```

Con el puerto configurado en `9000`:

- API: <http://localhost:9000/api>
- Swagger: <http://localhost:9000/api/docs>
- Archivos subidos: <http://localhost:9000/uploads>

## Datos iniciales (Seed)

### Seed base

Carga los datos mínimos del sistema (roles, usuarios, pantallas y permisos). Ejecutarlo una sola vez o cuando se requiera regenerar la información base.

```bash
curl -X GET 'http://localhost:9000/api/seed'
```

### Seed de desarrollo

Crea un ambiente completo: datos base, al menos un registro por catálogo (unidades, categorías, almacenes, productos, proveedores, clientes, departamentos, puestos, empleados, equipos, planes, refacciones, etc.) y registros demo operativos. Es idempotente para los catálogos, aunque algunos movimientos demo podrían duplicarse si se ejecuta repetidamente.

```bash
curl -X POST 'http://localhost:9000/api/seed/desarrollo' \
  -H 'x-development-seed-key: dev-seed-2026'
```

> Solo funciona cuando `NODE_ENV=development`. La clave se configura con `DEVELOPMENT_SEED_KEY`.

Credenciales de la semilla de desarrollo:

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `1234` | Administrador |
| `dev` | `1234` | Administrador |

## Convenciones de la API

### Identificadores

Las tablas conservan `id` como clave primaria interna para relaciones y joins. Todas las entidades exponen además `public_id` (UUID v7), visible en la API como `publicId`.

- Los clientes **nunca** deben enviar ni usar los IDs numéricos internos.
- Las rutas REST usan `:publicId`: `GET /api/usuarios/:publicId`.
- Las relaciones en request bodies esperan un `publicId` (`rolPublicId`, `productoPublicId`, etc.).
- El backend elimina `id` y los campos `*Id` numéricos de las respuestas; las relaciones se devuelven como objetos anidados.
- `publicId` no es un mecanismo de autenticación: la autorización depende de guards, permisos y roles.

PostgreSQL usa `snake_case`; TypeScript y JSON usan `camelCase`.

### Colección y paginación

| Necesitas | Endpoint | Respuesta |
|---|---|---|
| Todos los registros | `GET /recurso` | `[...]` |
| Página con búsqueda | `GET /recurso/paginacion?pagina=1&registros=10&buscar=texto` | `{ "total": number, "data": [...] }` |

La paginación **no** se envía sobre `GET /recurso`; es una ruta aparte (`/paginacion`).

### Autenticación y permisos

- Autenticación con **JWT Bearer**: `Authorization: Bearer <token>`.
- `POST /api/auth/login` devuelve `token`, `refreshToken` y los permisos del usuario.
- `POST /api/auth/refresh` renueva el par de tokens.
- `POST /api/auth/forgot-password` y `POST /api/auth/reset-password` gestionan la recuperación de contraseña.
- `GET /api/auth/perfil` devuelve el payload del usuario autenticado.
- Cada endpoint protegido valida una ruta de pantalla y traduce el método HTTP a una acción: `GET` → `ver`, `POST` → `crear`, `PUT/PATCH` → `editar`, `DELETE` → `eliminar`.
- Los roles con `esAdministrador: true` pasan todos los permisos.
- El frontend debe usar el árbol `permisos` del login para construir el menú y ocultar acciones.

### Validación y errores

La validación global usa `whitelist` + `forbidNonWhitelisted`: **enviar un campo desconocido produce `400`**.

Formato de error estándar de NestJS:

```json
{
  "statusCode": 400,
  "message": ["nombreUsuario should not be empty"],
  "error": "Bad Request"
}
```

Códigos esperados: `400`, `401`, `403`, `404`, `409`, `500`.

### Decimales, fechas y archivos

- Los campos `decimal`/`numeric` de PostgreSQL se devuelven como **string** (`"10.00"`); convertir con `Number()` antes de operar.
- Fechas de solo día: `"2026-01-31"`. Timestamps: ISO 8601.
- Subida de imágenes: `POST /api/uploads/subcarpeta?subcarpeta=<nombre>` con `multipart/form-data`, campo `archivo`. Acepta JPEG, PNG y WebP (máx. 2 MB) y devuelve `{ "url": "/uploads/<subcarpeta>/<archivo>" }`.
- Los reportes de RH se descargan como binarios (Excel/PDF); usar `response.blob()` en el frontend.

## Módulos y endpoints

Todas las rutas son relativas a `http://localhost:9000/api`. Consulta [`docs/API-FRONTEND.md`](docs/API-FRONTEND.md) para el detalle completo con permisos y payloads.

| Módulo | Ruta base | Descripción |
|---|---|---|
| Auth | `/auth` | Login, refresh, recuperación de contraseña y perfil |
| Usuarios | `/usuarios` | CRUD, paginación, estado, contraseña, perfil y foto |
| Roles | `/roles` | CRUD y activación de roles |
| Permisos | `/permisos` | Permisos por rol y pantalla |
| Pantallas | `/pantallas` | Pantallas y menús del sistema |
| Bitácora de accesos | `/bitacora-accesos` | Historial de inicios de sesión |
| Auditoría | `/auditoria` | Acciones auditadas |
| Branding | `/branding` | Apariencia, logos, colores y tipografía |
| Uploads | `/uploads` | Subida de imágenes |
| Almacén | `/almacen` | Almacenes, categorías, productos, unidades, inventario, movimientos y salidas |
| Compras | `/compras` | Proveedores y compras |
| Ventas | `/ventas` | Clientes, ventas, cotizaciones y detalles |
| RH | `/rh` | Departamentos, puestos, empleados, organigrama, turnos, asistencias, contratos, vacaciones y solicitudes de permiso |
| Reportes RH | `/rh/reportes` | Ficha de empleado y reportes Excel |
| Mantenimiento | `/mantenimiento` | Equipos, planes, refacciones, órdenes de trabajo y movimientos |
| Contabilidad | `/contabilidad` | Cuentas, pólizas, periodos, impuestos, bancos, cartera, CxC, CxP, nómina, presupuestos, centros de costo y conciliación |
| Comedor | `/comedor` | Turnos, menús y solicitudes de comida |
| Chat | `/chat` | Conversaciones, mensajes y ticket para WebSocket |
| Dashboard | `/dashboard` | KPIs y gráficas por área (ventas, compras, almacén, RH, mantenimiento, finanzas) |
| Seed | `/seed` | Datos iniciales y ambiente de desarrollo |

Ejemplos rápidos:

```http
POST /api/auth/login
GET  /api/almacen/productos
GET  /api/almacen/productos/paginacion?pagina=1&registros=10&buscar=laptop
POST /api/ventas/ventas
GET  /api/dashboard/ventas?desde=2026-01-01&hasta=2026-12-31&agrupacion=mes
```

## WebSockets

El backend expone **Socket.IO** en el mismo host y puerto que la API (`http://localhost:9000`).

Flujo de conexión:

1. El cliente solicita un ticket efímero con `POST /api/chat/ws-ticket` (requiere JWT).
2. Se conecta con `io('http://localhost:9000', { auth: { token: ticket.token } })`.
3. El ticket dura `WS_TICKET_TTL` segundos (60 por defecto) y **no** sirve para endpoints REST.
4. En caso de desconexión, solicitar un ticket nuevo y reconectar.

Eventos principales:

| Dirección | Evento | Payload |
|---|---|---|
| Cliente → servidor | `chat:join` | `{ conversacionPublicId }` |
| Cliente → servidor | `chat:send` | `{ conversacionPublicId, contenido }` |
| Cliente → servidor | `chat:typing` | `{ conversacionPublicId }` |
| Cliente → servidor | `chat:read` | `{ conversacionPublicId, mensajePublicId }` |
| Servidor → cliente | `chat:mensaje` | `{ conversacionPublicId, mensaje }` |
| Servidor → cliente | `chat:leido` | `{ conversacionPublicId, usuarioPublicId, mensajePublicId }` |
| Servidor → cliente | `chat:error` | `{ code, message }` |

Reglas relevantes:

- Solo los participantes de una conversación pueden unirse, escribir o marcar como leído.
- Límite de **10 mensajes cada 10 segundos por socket** (`code: "rate_limited"`).
- Los orígenes permitidos se configuran con `CORS_ORIGINS`.

El detalle completo está en [`docs/PLAN-WEBSOCKET-CHAT.md`](docs/PLAN-WEBSOCKET-CHAT.md).

## Ejecución con Docker

La imagen está basada en **Node.js 22 Alpine** y usa un **multi-stage build**:

- **Stage 1 (build)**: instala todas las dependencias con pnpm y compila TypeScript.
- **Stage 2 (producción)**: copia solo `dist/`, `package.json` y las dependencias de producción.

### Construir la imagen

```bash
docker build -t erp-backend .
```

### Ejecutar el contenedor

```bash
docker run -d --name erp-backend -p 9000:9000 \
  --env-file .env \
  -e DB_HOST=host.docker.internal \
  erp-backend
```

### Docker Compose (base de datos + aplicación)

El repositorio incluye un `docker-compose.yml`. Asegúrate de que `DB_NAME` en `.env` coincida con `POSTGRES_DB`. Ejemplo:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg18
    container_name: postgres
    restart: always
    environment:
      POSTGRES_DB: erp
      POSTGRES_USER: desarrollo
      POSTGRES_PASSWORD: desarrollo
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    image: erp-backend
    container_name: erp-backend
    restart: always
    env_file: .env
    ports:
      - "9000:9000"
    depends_on:
      - postgres

volumes:
  pgdata:
```

Levantar los servicios:

```bash
docker compose up -d
```

> Cuando uses Docker Compose, `DB_HOST` debe apuntar al nombre del servicio (`postgres`) en lugar de `localhost`, y `PORT` debe coincidir con el puerto mapeado (`9000`).

## Scripts disponibles

```bash
# Compilar el proyecto
pnpm run build

# Ejecutar en desarrollo
pnpm run start

# Ejecutar con recarga automática
pnpm run start:dev

# Ejecutar en modo debug
pnpm run start:debug

# Ejecutar el build compilado
pnpm run start:prod

# Formatear código
pnpm run format

# Linter (con corrección automática)
pnpm run lint

# Pruebas unitarias
pnpm run test

# Pruebas en modo watch
pnpm run test:watch

# Cobertura de pruebas
pnpm run test:cov

# Pruebas en modo debug
pnpm run test:debug

# Migraciones
pnpm run migration:show
pnpm run migration:run
pnpm run migration:revert
pnpm run migration:generate

# Smoke test de WebSocket (requiere BD migrada, seed y build)
pnpm run ws:smoke
```

## Estructura del proyecto

```text
src/
├── common/                 # Código transversal
│   ├── constants/
│   ├── decorators/
│   ├── dtos/               # DTOs de respuesta y paginación
│   ├── helpers/
│   ├── interceptors/       # Respuestas, auditoría y limpieza de uploads
│   ├── middleware/         # Normalización de publicId en entrada
│   ├── sockets/
│   └── validation/
├── core/
│   ├── database/
│   │   ├── entities/       # Entidades TypeORM
│   │   ├── migrations/     # Migraciones del esquema
│   │   ├── data-source.ts
│   │   └── snake-naming.strategy.ts
│   └── mail/
├── modules/
│   ├── auth/               # Autenticación JWT
│   ├── usuarios/ roles/ permisos/ pantallas/
│   ├── bitacora-accesos/ auditoria/
│   ├── branding/ uploads/ seed/
│   ├── almacen/ compras/ ventas/
│   ├── rh/ reportes/
│   ├── mantenimiento/ contabilidad/
│   ├── comedor/ chat/ dashboard/
│   └── ...
├── app.module.ts
└── main.ts
```

## Tecnologías

- **NestJS 11** y **TypeScript**
- **PostgreSQL 18** con **TypeORM** y migraciones
- **JWT** (`@nestjs/jwt`) para autenticación
- **Swagger / OpenAPI** (`@nestjs/swagger`)
- **Socket.IO** para chat y notificaciones en tiempo real
- **class-validator** / **class-transformer** para validación y transformación
- **Multer** para subida de archivos
- **Nodemailer** + **Handlebars** para correos
- **ExcelJS** y **PDFKit** para reportes
- **Jest** para pruebas unitarias
- **pnpm** como gestor de paquetes

## Solución de problemas

- **La API no responde en el puerto esperado**: el puerto se toma de `PORT` (por defecto `9000` en `.env`). Revisa también que Swagger esté en `/api/docs`.
- **`401` en rutas protegidas**: el token expiró o es inválido. Usa `POST /api/auth/refresh` o vuelve a iniciar sesión.
- **`403` en `POST /api/seed/desarrollo`**: `NODE_ENV` no es `development` o falta el header `x-development-seed-key`.
- **`400` con campos desconocidos**: la validación global rechaza propiedades no declaradas en el DTO.
- **Error al migrar por UUID v7**: se requiere PostgreSQL 18 o superior.
- **Imágenes no visibles**: verifica que la carpeta `uploads/` exista y que la API se esté ejecutando desde la raíz del proyecto.
- **WebSocket rechazado**: el ticket expiró (60 s), el origen no está en `CORS_ORIGINS` o el usuario no participa en la conversación.

## Licencia

Proyecto de uso interno. `UNLICENSED`.
