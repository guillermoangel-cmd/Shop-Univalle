# Catalog Service

Servicio NestJS de catálogo. Implementa un MVP hexagonal con dominio de productos, casos de uso, puerto de repositorio, adaptador Mongo y controlador REST.

## API

- `GET /products`: lista productos.
- `GET /products/:id`: consulta un producto; responde 404 cuando no existe.
- `POST /products`: crea un producto con nombre, categoría, precio y stock. Descripción e imagen son opcionales.

Ejemplo de creación:

```json
{
  "name": "Libreta Univalle",
  "description": "Papel reciclado",
  "imageUrl": "https://example.org/libreta.jpg",
  "category": "Papelería",
  "price": 18000,
  "stock": 12
}
```

La creación todavía no tiene autenticación/autorización administrativa; no debe exponerse públicamente hasta implementar esos controles.

## Ejecución

```bash
npm ci
npm run start:dev
```

Configura `PORT` (por defecto `3000`) y `MONGODB_URI` (por defecto `mongodb://127.0.0.1:27017/catalog`). Las pruebas unitarias se ejecutan con `npm test -- --runInBand` y la compilación con `npm run build`.

## Capas

- `src/catalog/domain`: entidad, reglas y puerto de repositorio.
- `src/catalog/application/use-cases`: creación, consulta y listado.
- `src/catalog/infrastructure`: controlador HTTP, esquema y adaptador Mongo.