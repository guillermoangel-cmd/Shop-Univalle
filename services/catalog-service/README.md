# Catalog Service

Servicio NestJS de tiendas, productos y categorías con arquitectura hexagonal, repositorios Mongo y API REST.

## API pública

- `GET /products`: productos activos de las tiendas activas.
- `GET /products?profileId=<id>`: productos activos de una tienda.
- `GET /products/:id`: consulta un producto activo.
- `GET /categories?profileId=<id>`: categorías activas; el parámetro de tienda es opcional.

## API de tiendas y moderación

Las operaciones de escritura requieren un JWT válido. Cada usuario gestiona solo el catálogo vinculado a su perfil. Las operaciones de moderación requieren el rol `ADMINISTRATIVO`.

- `GET /categories/manage`: categorías propias activas e inactivas.
- `POST /categories`: crea una categoría propia.
- `PATCH /categories/:id`, `PATCH /categories/:id/activate` y `DELETE /categories/:id`: actualiza, habilita o desactiva una categoría propia.
- `POST /products`: publica un producto propio en una categoría de la misma tienda.
- `GET /products/manage`: productos activos e inactivos (administrativos pueden consultar todos).
- `PATCH /products/:id/status`: permite a un administrativo habilitar o desactivar cualquier producto.

El `profileId` no se acepta del navegador para crear contenido: se toma del `sub` firmado del JWT. `categorias` y `products` guardan ese identificador, que corresponde al `userId` de la colección `perfiles` del servicio de usuarios. Así se aísla la gestión entre tiendas. Las categorías con productos no se pueden desactivar.

## Ejemplo de creación

```json
{
  "name": "Jugo natural",
  "description": "Jugo de fruta de temporada",
  "imageUrl": "https://example.org/jugo.jpg",
  "categoryId": "<id-de-una-categoria-propia>",
  "price": 8000,
  "stock": 12
}
```

Configura el mismo `JWT_SECRET` en Usuarios, Catálogo, Pedidos y Gateway.

## Ejecución

```bash
npm ci
npm run start:dev
npm test -- --runInBand
npm run build
```

Define `MONGODB_URI` (por defecto `mongodb://127.0.0.1:27017/univalle_catalog`) y `JWT_SECRET`. Configura `PORT` (por defecto `3000`).

## Capas

- `src/catalog/domain`: entidades, reglas y puertos de repositorio.
- `src/catalog/application/use-cases`: creación, consulta y gestión de productos y categorías.
- `src/catalog/infrastructure`: controladores HTTP, validación JWT, esquemas y adaptadores Mongo.
