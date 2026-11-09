# Instrucciones de arranque – Univalle Shop

## 1. Descripción general

Este documento explica cómo preparar el entorno de desarrollo, ejecutar el proyecto y conocer la configuración actual de las bases de datos.

## 2. Requisitos previos

Antes de ejecutar el proyecto, es necesario contar con las siguientes herramientas:

- **Node.js:** entorno de ejecución de JavaScript.
- **npm:** administrador de paquetes de Node.js.
- **MongoDB:** sistema de gestión de bases de datos.
- **Git:** para clonar y actualizar el repositorio.
- **Visual Studio Code:** u otro editor de código.

## 3. Ejecución del frontend

Para iniciar la aplicación web, sigue estos pasos:

### Paso 1. Abrir una terminal

Abre una terminal de comandos (PowerShell, CMD o terminal integrada de Visual Studio Code) en la carpeta raiz del proyecto. **/Shop-Univalle**

### Paso 2. Ingresar a la carpeta frontend

Ubícate en la carpeta raíz del proyecto y ejecuta:

```bash
cd frontend
```

### Paso 3. Instalar las dependencias (si no las tienes)

Si es la primera vez que ejecutas el proyecto o no tienes instalada la carpeta `node_modules`, ejecuta:

```bash
npm install
```

### Paso 4. Iniciar el servidor de desarrollo

Ejecuta el siguiente comando:

```bash
npm run dev
```

Vite iniciará el servidor de desarrollo y mostrará una dirección local similar a:

```text
http://localhost:5173/
```

Abre esa dirección en el navegador para visualizar la aplicación.

### Paso 5. Iniciar el servicio y api que recibe las solicitudes

**API Gateway**

```bash
cd api-gateway
npm install **si no tienes las dependencias intaladas**
npm run start:dev
```

**User Service**

```bash
cd services/user-service
npm install **si no tienes las dependencias intaladas**
npm run start:dev
```

**Importante:** Mantén abierta la terminal mientras utilizas la aplicación. Para detener el servidor, presiona `Ctrl + C`.

## 4. Bases de datos

El proyecto utiliza MongoDB para almacenar la información de los diferentes microservicios.

Actualmente se encuentra configurada la siguiente base de datos en login por lo que si no las tienes debes crear la base de datos con el nombre **univalle_users** y las colecciones **usuarios**, **correos_institucionales** NOTA IMPORTANTE: recordar la contraseña creada de usuario:

### 4.1. Informacion de la Base de datos `univalle_users`

Esta base de datos almacena la información relacionada con los usuarios y la autorización de correos institucionales.

**Base de datos:** `univalle_users`

**Colecciones existentes:**

| Colección | Descripción |
|---|---|
| `usuarios` | Almacena los usuarios que han activado su cuenta en la aplicación. |
| `correos_institucionales` | Contiene los correos institucionales autorizados para utilizar la plataforma. |

### 4.2. Datos de prueba

Para realizar pruebas de inicio de sesión se encuentra registrado el siguiente usuario:

**Usuario de prueba:**

| Campo | Valor |
|---|---|
| Nombre | Estudiante Demo |
| Correo | estudiante.demo@correounivalle.edu.co |
| Rol | ESTUDIANTE |
| Estado | ACTIVO |
| Correo verificado | Sí |

**Correo institucional autorizado:**

| Campo | Valor |
|---|---|
| Correo | estudiante.demo@correounivalle.edu.co |
| Nombre | Estudiante |
| Apellido | Demo |
| Rol | ESTUDIANTE |
| Autorizado | Sí |

**Contraseña:** Utilizar la contraseña de prueba configurada durante la creación del usuario.

> Nota: La contraseña se almacena mediante un hash bcrypt en la base de datos. No debe confundirse el hash almacenado con la contraseña original.

### 4.3. Otras bases de datos

A medida que se desarrollen e integren los demás microservicios, se necesitarán bases de datos independientes a nivel lógico para separar la información de cada dominio.

Entre las bases de datos previstas se encuentran:

| Base de datos | Microservicio | Propósito |
|---|---|---|
| `univalle_users` | Users Service | Usuarios y correos institucionales. |
| `univalle-catalog` | Catalog Service | Productos, categorías y etiquetas. |
| `univalle_cart` | Cart Service | Carritos de compra y productos seleccionados. |
| `univalle_payments` | Payments Service | Información y registros de pagos. |

Estas bases de datos adicionales están previstas para las siguientes etapas del desarrollo y no necesariamente se encuentran creadas o configuradas todavía.

## 5. Consideraciones importantes

- Cada microservicio debe contar con su propia configuración de conexión a MongoDB.
- Los datos de conexión deben almacenarse en archivos `.env`.
- Los archivos `.env` no deben subirse al repositorio de GitHub.
- Se recomienda mantener un archivo `.env.example` con las variables necesarias, sin credenciales reales.
- Las dependencias del frontend se instalan desde la carpeta `frontend`.
- El comando `npm run dev` ejecuta únicamente el frontend; los microservicios deben iniciarse por separado cuando corresponda.
- Para probar la autenticación, el Users Service y MongoDB deben estar ejecutándose y correctamente configurados.

## 6. Estado actual del proyecto

| Componente | Estado |
|---|---|
| Frontend con React y Vite | En desarrollo |
| Página de inicio de sesión | Implementada |
| Integración con Users Service | En desarrollo |
| Página principal del catálogo | Diseñada |
| Base de datos `univalle_users` | Configurada |
| Colección `usuarios` | Configurada |
| Colección `correos_institucionales` | Configurada |
| Bases de datos de otros microservicios | Pendientes |
| Ejecución mediante Docker | Pendiente de configuración |

---

**Proyecto:** Univalle Shop  
**Tecnologías principales:** React, TypeScript, Node.js, NestJS y MongoDB.  
**Arquitectura:** Microservicios y arquitectura hexagonal.