<p align="center"> <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a> </p> 
# API Backend

Backend desarrollado con NestJS y TypeScript.

## Documentación

- Guía de integración para el frontend: [`docs/API-FRONTEND.md`](docs/API-FRONTEND.md)
- Swagger interactivo (con el backend levantado): `http://localhost:9000/api/docs`

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- PostgreSQL

## Instalación

Clonar el repositorio:

```bash
git clone <http://192.168.1.7/backend/nestjstypeorm.git>
cd <Backend>
```

Instalar dependencias:

```bash
npm install
```

## Configuración

Crear el archivo `.env` con las variables de entorno necesarias para la conexión a la base de datos y demás configuraciones del proyecto.

Ejemplo:

```env
PORT=9000

DB_NAME=test
DB_USERNAME=desarrollo
DB_PASSWORD=desarrollo
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=MiClaveSecretaSuperSeguraParaPruebasNest123!
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
PASSWORD_RESET_EXPIRES_IN=1h
WS_TICKET_TTL=60
CORS_ORIGINS=http://localhost:3000,http://localhost:4200

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
APP_URL=
```

## Ejecución del proyecto

## Convención de identificadores

Las tablas conservan `id` como clave primaria interna para relaciones, foreign keys y joins. Todas las entidades tienen además `public_id UUID NOT NULL UNIQUE`, expuesto en TypeScript/API como `publicId` y generado como UUID v7 por PostgreSQL 18.

Los clientes nunca deben enviar ni utilizar los IDs numéricos internos. Los recursos REST utilizan `:publicId` y las relaciones de entrada utilizan nombres como `rolPublicId` o `productoPublicId`. La autorización continúa dependiendo de guards, permisos y roles; `publicId` no es un mecanismo de autenticación.

PostgreSQL usa `snake_case`; TypeScript y JSON usan `camelCase`. Las relaciones de base de datos continúan apuntando a `id`, no a `public_id`.

La aplicación no ejecuta `synchronize`. Después de respaldar la base de datos, aplicar la migración con:

```bash
pnpm run migration:run
```

La migración de UUID v7 requiere PostgreSQL 18 o superior.

## Comedor

El módulo de comedor permite configurar turnos con periodicidad `semanal`, `quincenal` o `mensual`, publicar menús por periodo y que cada empleado separe sus comidas del siguiente periodo permitido.

Endpoints principales:

```http
GET  /api/comedor/turnos
POST /api/comedor/turnos
GET  /api/comedor/menus
GET  /api/comedor/menus/siguiente
POST /api/comedor/menus
POST /api/comedor/solicitudes
GET  /api/comedor/solicitudes/mias
DELETE /api/comedor/solicitudes/:publicId
```

El empleado debe tener un turno asignado. El backend valida que la periodicidad del menú coincida con la del turno y que el menú corresponda a la siguiente semana, quincena o mes. Las solicitudes son únicas por empleado y menú.

### Modo desarrollo

```bash
npm run start:dev
```

### Modo producción

```bash
npm run build
npm run start:prod
```

## Inicialización de datos (Seed)

Una vez que la aplicación esté ejecutándose correctamente, es necesario cargar los datos iniciales de la base de datos mediante el endpoint de seed.

Ejecutar:

```http
GET http://localhost:3000/api/seed
```

O mediante curl:

```bash
curl -X 'GET' \
  'http://localhost:3000/api/seed' \
  -H 'accept: */*'
```

Este proceso creará los registros necesarios para el funcionamiento inicial del sistema, incluyendo:

- **Roles** (administrador, usuario, etc.)
- **Usuarios** iniciales con sus perfiles
- **Pantallas** y menús del sistema
- **Permisos** por rol y pantalla

> Nota: El endpoint de seed debe ejecutarse únicamente la primera vez o cuando se requiera regenerar la información base del sistema.

## Seed de desarrollo

Existe un endpoint dedicado para levantar un ambiente de desarrollo completo. Además de los datos base de `inicio.ts`, crea al menos un registro por catálogo (unidades, categorías, almacenes, productos, proveedores, clientes, departamentos, puestos, empleados, equipos, planes, refacciones, etc.) y registros demo operativos. Es idempotente.

Ejecutar:

```http
POST http://localhost:3000/api/seed/desarrollo
```

Con la clave de desarrollo en el header:

```bash
curl -X 'POST' \
  'http://localhost:3000/api/seed/desarrollo' \
  -H 'x-development-seed-key: dev-seed-2026'
```

> Solo funciona cuando `NODE_ENV=development`. En producción se rechaza con `403`. La clave se configura con `DEVELOPMENT_SEED_KEY`.

## Ejecución con Docker

### Requisitos

- Docker
- Docker Compose (opcional, para base de datos)

### Imagen Docker (NestJS)

La imagen está basada en **Node.js 22 Alpine** (`node:22-alpine`) y utiliza un **multi-stage build** para optimizar el tamaño final:

- **Stage 1 (build)**: Instala todas las dependencias (incluyendo devDependencies) y compila el proyecto TypeScript
- **Stage 2 (production)**: Copia solo `dist/` y `node_modules` de producción, resultando en una imagen ligera (~150MB)

El `Dockerfile` expone el puerto `3000` y usa `node dist/main` como comando de inicio.

### Construir la imagen

```bash
docker build -t pruebas-nest .
```

### Ejecutar el contenedor

```bash
docker run -d --name pruebas-nest -p 3000:3000 --env-file .env -e DB_HOST=host.docker.internal pruebas-nest
```

### Docker Compose (base de datos + aplicación)

Crear un archivo `docker-compose.yml` en la raíz del proyecto:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg18
    container_name: postgres
    restart: always
    environment:
      POSTGRES_DB: pruebas
      POSTGRES_USER: desarrollo
      POSTGRES_PASSWORD: desarrollo
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    image: pruebas-nest
    container_name: pruebas-nest
    restart: always
    env_file: .env
    ports:
      - '3000:3000'
    depends_on:
      - postgres
volumes:
  pgdata:
```

Luego levantar ambos servicios:

```bash
docker compose up -d
```

> Nota: Asegúrate de que en el `.env` la variable `DB_HOST` apunte al nombre del servicio (`postgres`) en lugar de `localhost` cuando uses Docker Compose.
> Ejemplo:

```env
PORT= 3000

DB_NAME=test
DB_USERNAME=desarrollo
DB_PASSWORD=desarrollo
DB_HOST=postgres
DB_PORT=5432

JWT_SECRET=MiClaveSecretaSuperSeguraParaPruebasNest123!
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
PASSWORD_RESET_EXPIRES_IN=1h
WS_TICKET_TTL=60
CORS_ORIGINS=http://localhost:3000,http://localhost:4200

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
APP_URL=
```

## Scripts disponibles

```bash
# Compilar proyecto
npm run build

# Ejecutar en desarrollo
npm run start

# Ejecutar con recarga automática
npm run start:dev

# Ejecutar en modo debug
npm run start:debug

# Ejecutar compilado
npm run start:prod

# Formatear código
npm run format

# Linter
npm run lint

# Pruebas unitarias
npm run test

# Smoke test de WebSocket (requiere BD migrada, seed y build)
npm run ws:smoke

# Cobertura de pruebas
npm run test:cov
```

## Estructura del proyecto

```text
src/
├── modules/          # módulos de negocio (auth, usuarios, ventas, rh, almacén, ...)
├── common/           # código transversal (DTOs, decoradores, interceptores, helpers)
├── core/             # infraestructura (database, mail)
│   ├── database/
│   └── mail/
├── app.module.ts
└── main.ts
```

## Tecnologías utilizadas

- NestJS
- TypeScript
- PostgreSQL
- TypeORM

## Licencia

Proyecto de uso interno.
