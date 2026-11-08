# Catalog Service

Servicio NestJS de catálogo. Implementa productos y categorías con arquitectura hexagonal, repositorios Mongo y API REST.

## API pública

- `GET /products`: lista productos.
- `GET /products/:id`: consulta un producto; responde 404 cuando no existe.
- `GET /categories`: lista categorías activas.

## API de administración

Las operaciones de escritura requieren `Authorization: Bearer <JWT>` de un usuario con rol `ADMINISTRADOR`.

- `GET /categories/manage`: lista categorías activas e inactivas.
- `POST /categories`: crea una categoría con nombre y descripción opcional.
- `PATCH /categories/:id`: actualiza el nombre o descripción.
- `PATCH /categories/:id/activate`: reactiva una categoría inactiva.
- `DELETE /categories/:id`: desactiva la categoría. No se permite mientras tenga productos asociados.
- `POST /products`: publica un producto con nombre, `categoryId`, precio, existencias; descripción e imagen son opcionales.

Ejemplo de creación:

```json
{
  "name": "Jugo natural",
  "description": "Jugo de fruta de temporada",
  "imageUrl": "https://example.org/jugo.jpg",
  "categoryId": "<id-de-una-categoria-activa>",
  "price": 8000,
  "stock": 12
}
```

Las categorías se guardan en `categorias`; los productos se mantienen en la colección existente `products`, conservan el nombre de categoría para lectura y guardan `categoryId` como referencia. Las categorías con productos no se pueden desactivar, preservando la integridad de referencias.

La aplicación de catálogo valida firma HS256, expiración y rol del JWT. Configura el mismo `JWT_SECRET` en Usuarios y Catálogo; Compose lo comparte a ambos servicios.

Para habilitar una cuenta de administración, un operador debe asignar `ADMINISTRADOR` al correo institucional autorizado en MongoDB, dentro de `correos_institucionales`. Al activar una cuenta nueva, el rol se copia de ese registro. Para promover una cuenta existente, actualiza ambos documentos y vuelve a iniciar sesión para emitir un JWT con el nuevo rol:

```javascript
db.correos_institucionales.updateOne(
  { email: "admin@correounivalle.edu.co" },
  { $set: { nombre: "Nombre", apellido: "Administrador", rol: "ADMINISTRADOR", authorized: true } },
  { upsert: true }
)
db.usuarios.updateOne(
  { email: "admin@correounivalle.edu.co" },
  { $set: { rol: "ADMINISTRADOR" } }
)
```

No se debe asignar el rol desde el formulario ni aceptar un rol enviado por el cliente.

## Ejecución

```bash
npm ci
```

Define `MONGODB_URI` (por defecto `mongodb://127.0.0.1:27017/univalle_catalog`) y `JWT_SECRET`, igual al del servicio de usuarios:

```bash
npm run start:dev
```

Configura `PORT` (por defecto `3000`). Las pruebas unitarias se ejecutan con `npm test -- --runInBand` y la compilación con `npm run build`.

## Capas

- `src/catalog/domain`: entidad, reglas y puerto de repositorio.
- `src/catalog/application/use-cases`: creación, consulta, listado y gestión de categorías.
- `src/catalog/infrastructure`: controladores HTTP, guard de administrador, esquemas y adaptadores Mongo.