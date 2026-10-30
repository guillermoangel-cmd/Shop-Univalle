# 🛒 Shop-Univalle

**Plataforma de comercio electrónico de la comunidad universitaria de la Universidad del Valle.**

Shop-Univalle es un proyecto de desarrollo de software que busca construir una plataforma de comercio electrónico mediante una arquitectura basada en microservicios, permitiendo organizar, administrar y gestionar los diferentes componentes de la aplicación de manera independiente.

Actualmente, el proyecto cuenta con una aplicación frontend, un API Gateway y un servicio de catálogo de productos.

---

## 📌 Estado del proyecto

**En desarrollo** 🚧

El proyecto se encuentra en fase de construcción e integración de sus componentes.

## 🏗️ Arquitectura del proyecto

El sistema utiliza una arquitectura de microservicios, separando las responsabilidades de la aplicación en diferentes componentes.

```text
Shop-Univalle/
│
├── api-gateway/             # Punto de entrada de las solicitudes
│
├── frontend/                # Aplicación web
│
├── services/
│   └── catalog-service/     # Microservicio de catálogo (otros servicios en desarrollo)
│
├── compose.yaml             # Orquestación de contenedores
│
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore               # Archivos excluidos de Git
└── README.md                # Documentación principal
```

### Componentes principales

| Componente | Descripción | Tecnología |
|---|---|---|
| Frontend | Interfaz de usuario de la aplicación. | React, TypeScript y Vite |
| API Gateway | Punto de entrada y gestión de solicitudes hacia los servicios. | NestJS |
| Catalog Service | Microservicio encargado de las operaciones del catálogo. (otros servicios en desarrollo) | NestJS |
| Compose | Configuración para la ejecución de los componentes mediante contenedores. | Docker Compose |

## 🛠️ Tecnologías utilizadas

**Frontend**
- React
- TypeScript
- Vite
- CSS

**Backend**
- Node.js
- NestJS
- TypeScript

**Infraestructura y herramientas**
- Docker
- Docker Compose
- Git
- GitHub
- npm

## ⚙️ Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instaladas las siguientes herramientas:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para ejecución con contenedores).
- Visual Studio Code (recomendado).

## 🚀 Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/guillermoangel-cmd/Shop-Univalle.git
```

Ingresar al directorio:

```bash
cd Shop-Univalle
```

### 2. Configurar las variables de entorno

El proyecto incluye un archivo `.env.example` como referencia para configurar las variables de entorno.

Crea los archivos `.env` correspondientes a cada componente que los necesite y configura sus valores según la documentación de cada servicio.

**Importante:** No publiques archivos `.env` con contraseñas, tokens o credenciales en GitHub.

### 3. Instalar dependencias

**Frontend**

```bash
cd frontend
npm install
```

**API Gateway**

```bash
cd ../api-gateway
npm install
```

**Catalog Service**

```bash
cd ../services/catalog-service
npm install
```

## ▶️ Ejecución en desarrollo

Cada componente puede ejecutarse individualmente desde su directorio.

**Frontend**

```bash
cd frontend
npm run dev
```

**API Gateway**

```bash
cd api-gateway
npm run start:dev
```

**Catalog Service**

```bash
cd services/catalog-service
npm run start:dev
```

Ejecuta cada componente en una terminal independiente. Consulta los archivos `package.json` y la documentación interna de cada servicio para verificar sus scripts, puertos y variables de entorno.

## 🐳 Ejecución con Docker

El proyecto dispone de un archivo `compose.yaml` para organizar la ejecución de los componentes mediante Docker Compose.

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Para ejecutar los contenedores en segundo plano:

```bash
docker compose up -d --build
```

Para detener los servicios:

```bash
docker compose down
```

La ejecución requiere tener Docker Desktop instalado y configurado correctamente.

## 🌿 Flujo de trabajo con Git

Para mantener organizado el trabajo colaborativo, se recomienda utilizar ramas independientes para cada funcionalidad.

Crear una nueva rama:

```bash
git checkout -b feature/nombre-funcionalidad
```

Agregar los cambios:

```bash
git add .
```

Crear un commit:

```bash
git commit -m "feat: descripción del cambio"
```

Subir la rama:

```bash
git push -u origin feature/nombre-funcionalidad
```

Posteriormente, crear un **Pull Request** en GitHub para revisar e integrar los cambios en la rama principal.

### Convención de commits

Se recomienda utilizar los siguientes prefijos:

| Prefijo | Uso |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de errores |
| `docs:` | Cambios en la documentación |
| `refactor:` | Mejoras en el código |
| `style:` | Cambios de formato y estilos |
| `test:` | Pruebas |
| `chore:` | Tareas de mantenimiento |

## 📁 Documentación de los componentes

Cada componente puede contar con su propia documentación técnica:

- [API Gateway](./api-gateway/README.md)
- [Frontend](./frontend/README.md)
- [Catalog Service](./services/catalog-service/README.md)

## 🤝 Contribución

Shop-Univalle es un proyecto de trabajo colaborativo en grupos definidos.

Para contribuir:

1. Clona el repositorio.
2. Crea una rama para tu funcionalidad.
3. Realiza los cambios correspondientes.
4. Comprueba que el componente funcione correctamente.
5. Envía tus cambios mediante un Pull Request.
6. Espera la revisión e integración de los cambios.

Se recomienda mantener el código organizado, documentado y coherente con la arquitectura del proyecto.

## 🔐 Seguridad

- No subir credenciales ni archivos `.env`.
- No publicar tokens o claves privadas.
- Mantener actualizadas las dependencias.
- Utilizar variables de entorno para información sensible.
- Revisar los cambios antes de realizar un commit.

## 📄 Licencia

Proyecto académico en desarrollo. Los términos de uso, distribución y licencia deberán establecerse por los responsables del proyecto.  (Fabian Martinez, Guillermo Angel, Jhan Carlos Vivas, Francisco Ararat)

---

**Shop-Univalle**  
*Desarrollando soluciones tecnológicas para la comunidad universitaria.* 🎓

Universidad del Valle | Proyecto de desarrollo de software
