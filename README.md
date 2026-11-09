# 🛒 Shop-Univalle

**Plataforma de comercio electrónico de la comunidad universitaria de la Universidad del Valle.**

Shop-Univalle es un proyecto de desarrollo de software que busca construir una plataforma de comercio electrónico mediante una arquitectura basada en microservicios y arquitectura hexagonal, permitiendo organizar, administrar y gestionar los diferentes componentes de la aplicación de manera independiente.

---

## 📌 Estado del proyecto

**En desarrollo** 🚧

El proyecto se encuentra en fase de construcción e integración de sus componentes.

## 🏗️ Arquitectura del proyecto

El sistema utiliza una arquitectura de microservicios y hexagonal, separando las responsabilidades de la aplicación en diferentes componentes.

```text
Shop-Univalle/
│
├── api-gateway/             # Punto de entrada de las solicitudes
├── docs/                    # Documentacion
│
├── frontend/                # Aplicación web
│
├── services/
│   ├── catalog-service/     # Productos, API REST y MongoDB
│   ├── user-service/        # Registro y persistencia de usuarios
│   ├── orders-service/      # Pendiente
│   ├── payments-service/    # Pendiente
│   ├── search-service/      # Pendiente
│   └── recommendation-service/ # Pendiente
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
| Catalog Service | Tiendas, productos y categorías aislados por perfil; moderación por administrativos. | NestJS, MongoDB |
| User Service | Autenticación, perfiles de tienda y direcciones de entrega. | NestJS, MongoDB |
| Orders Service | Carritos y pedidos independientes por comprador y tienda. | NestJS, MongoDB |
| Payments, Search, Recommendations | Componentes planificados, todavía sin implementación. | Pendiente |
| Compose | Frontend, gateway, servicios activos y una BD por servicio. | Docker Compose |

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

### 2. Instalar dependencias

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
npm ci
```

**User Service**

```bash
cd ../services/user-service
npm ci
```

## ▶️ Ejecución del proyecto

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

**User Service**

```bash
cd services/user-service
npm run start:dev
```

**Catalog Service**

```bash
cd services/catalog-service
npm run start:dev
```

**Lo mismo para los demas servicios en sus carpetas**

Ejecuta cada componente en una terminal independiente. Consulta los archivos `package.json` y la documentación interna de cada servicio para verificar sus scripts, puertos y variables de entorno.

En modo Vite, el frontend reenvía `/api` a `http://localhost:3000`; inicia el gateway y configura las URL/puertos de catálogo y usuarios para el entorno local.

Cada cuenta tiene una tienda en `perfiles` y una lista de direcciones de entrega en `usuarios`. Productos y categorías se vinculan a la tienda del creador. Los administrativos pueden moderar tiendas y productos; no existe un rol `ADMINISTRADOR`. Cada carrito se guarda por comprador y tienda, y el pago usa la dirección seleccionada en el perfil del comprador.

Desde la página de la propia tienda, los usuarios pueden editar y eliminar sus productos y categorías; las eliminaciones del catálogo son reversibles. Las imágenes de productos y de tienda aceptan archivos PNG, JPEG o WebP de hasta 5 MB. Si no se configura una imagen o se restablece, se usa `frontend/public/assets/default_products/producto_default.webp` o `frontend/public/assets/default_profile/perfil_default.webp`. La imagen de tienda también aparece en las tarjetas y la vista de catálogo. Al reemplazar o restablecer una imagen se elimina el archivo anterior si ya no está asociado a otro producto o tienda. Las cargas se sirven desde `/uploads/assets/user_productos_img` y `/uploads/assets/user_perfiles_img` y, en Docker, se conservan en el volumen `gateway-uploads`.

La gestión del catálogo desde el perfil siempre se limita a productos y categorías de la cuenta autenticada. La pantalla administrativa, en cambio, lista productos y categorías de todas las tiendas con el apodo de la tienda creadora, y permite desactivarlos o reactivarlos.

Para iniciar todos los componentes con `npm run dev`, MongoDB debe estar disponible en `localhost:27017`. El script adapta a `localhost` los nombres de host de MongoDB definidos para Docker Compose y avisa si la base local no está escuchando. Puedes iniciar MongoDB con `docker run --rm --name univalle-users-mongo -p 27017:27017 mongo:8`.

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

**La ejecución requiere tener Docker Desktop instalado y configurado correctamente.**

## Diseño y seguimiento

La descripción inicial de arquitectura, límites y pendientes está en [docs/SDD.md](docs/SDD.md). El tablero Jira del equipo debe enlazarse allí cuando esté disponible; cada servicio pendiente debe convertirse en épica/tareas antes de implementarlo.

## 🌿 Flujo de trabajo con Git

Para mantener organizado el trabajo colaborativo, se recomienda utilizar ramas independientes para cada funcionalidad.

Crear una nueva rama:

```bash
git checkout -b fabian-martinez
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
git push -u origin fabian-martinez
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
