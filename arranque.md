# Arranque de Univalle Shop

## Requisitos

- Node.js y npm disponibles en `PATH`.
- Docker Desktop si se usarán contenedores.
- MongoDB disponible localmente en `127.0.0.1:27017`, o una configuración válida mediante las variables del archivo `.env`.
- Las dependencias instaladas en cada aplicación.

## Instalación inicial

Desde la raíz del proyecto, instala las dependencias de los tres microservicios, el API Gateway y el frontend:

```powershell
npm install --prefix services/catalog-service
npm install --prefix services/user-service
npm install --prefix services/orders-service
npm install --prefix api-gateway
npm install --prefix frontend
```

También puede usar Docker Compose para descargar e iniciar las imágenes y bases de datos necesarias:

```powershell
docker compose up --build
```

## Arranque completo en una sola terminal

Ejecute desde la raíz del proyecto:

```powershell
npm run dev
```

Este script inicia simultáneamente:

- Primera pantalla del proyecto en `http://localhost:5173`
- API Gateway en `http://localhost:3000`
- Catalog service en `http://localhost:3002`
- User service en `http://localhost:3003`
- Orders service en `http://localhost:3004`

Abra [http://localhost:5173](http://localhost:5173) en el navegador para iniciar desde la primera pantalla de la aplicación.

Para detener todos los procesos, use `Ctrl+C` en la misma terminal.

El script [dev-all.mjs](/D:/Programas/Proyectos/Shop-Univalle/scripts/dev-all.mjs) carga las variables de `.env`, verifica que MongoDB responda y lanza los cinco procesos.

## Arranque alternativo con Docker

Si prefiere que todo se ejecute en contenedores:

```powershell
docker compose up --build
```

Para detener y eliminar los contenedores creados:

```powershell
docker compose down
```

Los volúmenes de MongoDB no se eliminan con `docker compose down`. Se conservan los datos almacenados.


# Bases de datos y colecciones de MongoDB

El proyecto utiliza una base de datos independiente para cada microservicio. Las bases predeterminadas son:

| Microservicio | Base de datos | URI local predeterminada |
|---|---|---|
| Catálogo | `univalle-catalog` | `mongodb://127.0.0.1:27017/univalle-catalog` |
| Usuarios | `univalle_users` | `mongodb://127.0.0.1:27017/univalle_users` |
| Pedidos | `univalle_orders` | `mongodb://127.0.0.1:27017/univalle_orders` |

Docker Compose usa contenedores separados para cada base:

- `catalog-mongo`: base `univalle-catalog`
- `user-mongo`: base `univalle_users`
- `orders-mongo`: base `univalle_orders`

## Colecciones necesarias

### Base `univalle-catalog`

- `categorias`: categorías creadas por los vendedores.
- `products`: productos del catálogo.

### Base `univalle_users`

- `usuarios`: cuentas activadas del sistema.
- `perfiles`: perfil, dirección e imagen de cada usuario.
- `correos_institucionales`: correos institucionales autorizados para activar cuentas.

### Base `univalle_orders`

- `carts`: carrito actual de cada usuario y tienda.
- `orders`: pedidos registrados durante el checkout.

## Creación automática de MongoDB

**No es obligatorio crear manualmente las bases de datos ni las colecciones.**

MongoDB crea automáticamente una base de datos y una colección cuando se recibe el primer documento correspondiente. Por ejemplo, al guardar el primer producto se crea `univalle-catalog` y `products` si todavía no existen.

Es necesario mantener MongoDB en ejecución y asegurarse de que los microservicios estén configurados con las URI correctas. Las colecciones solo aparecerán después de que existan datos o de ejecutar los procesos que las crean.
