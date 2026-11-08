# User Service

Servicio NestJS de autenticación con arquitectura hexagonal. El rol se obtiene exclusivamente del correo autorizado; nunca se acepta desde el formulario. Los roles admitidos son `ESTUDIANTE`, `DOCENTE`, `ADMINISTRATIVO` y `ADMINISTRADOR`.

Para asignar administración, un operador debe cambiar el rol del correo en la colección `correos_institucionales` antes de que active su cuenta. Para un usuario existente, actualiza también `usuarios.rol`; debe iniciar sesión nuevamente para recibir el rol actualizado en el JWT. No se habilita el rol administrador desde la interfaz pública.

## Colecciones MongoDB

La conexión usa `MONGODB_URI`, con base predeterminada `univalle_users`.

- `correos_institucionales`: `email`, `nombre`, `apellido`, `rol` y `authorized`.
- `usuarios`: `email`, `passwordHash`, `rol`, `estado` y `emailVerified`.

## Flujo y API

El gateway expone:

- `POST /api/users/activate` con `{ "email": "estudiante.demo@correounivalle.edu.co", "password": "una-clave-de-8-caracteres" }`.
- `POST /api/users/login` con `{ "email": "estudiante.demo@correounivalle.edu.co", "password": "una-clave-de-8-caracteres" }`.

La activación exige un correo `@correounivalle.edu.co` presente y autorizado en `correos_institucionales`. Nombre y rol provienen de ese registro. La contraseña requiere al menos 8 caracteres y se almacena con bcrypt. El login responde con un JWT de una hora y el perfil público.

La pertenencia se simula con una lista ficticia; esto no comprueba control real del correo y no debe usarse como autenticación de producción.

## Datos de demostración

El seed es manual e idempotente; lee `seeds/data/correos-institucionales.seed.json` y solo agrega los registros si no existen:

```bash
npm run seed:authorized-emails
```

Con Docker Compose:

```bash
docker compose exec user-service npm run seed:authorized-emails
```

Correos de demostración: `estudiante.demo@correounivalle.edu.co` contraseña: `12345678`,

otros ejemplos: `docente.demo@correounivalle.edu.co` y `administrativo.demo@correounivalle.edu.co`. Define una contraseña al activar cada cuenta.

> **Usuario demo administrador:** `administrador.demo@correounivalle.edu.co` sirve para probar la administración del catálogo: al iniciar sesión puede crear, editar, desactivar y reactivar categorías, y publicar productos que aparecerán para los usuarios de la tienda. Está marcado `authorized: false` en el seed para que nadie pueda activar esta cuenta privilegiada automáticamente. Para una prueba local controlada, un operador debe autorizar el correo en `correos_institucionales`; después se activa la cuenta definiendo una contraseña. No reutilices esta cuenta ni la habilites en un entorno público.

## Configuración y desarrollo

Configura `MONGODB_URI` y un `JWT_SECRET` aleatorio de al menos 32 caracteres. Para Mongo local, usa `mongodb://127.0.0.1:27017/univalle_users`; dentro de Compose, `mongodb://user-mongo:27017/univalle_users`. Compose utiliza el valor `USER_MONGODB_URI` del `.env` raíz, así que puedes apuntarlo a la instancia donde ya existe `univalle_users`.

```bash
npm ci
npm run start:dev
npm test -- --runInBand
npm run build
```

En local el servicio escucha en `3003` por defecto; Compose establece `PORT=3000`.

## Capas

- `domain`: entidades, roles y puertos de repositorio/seguridad.
- `application`: activación e inicio de sesión.
- `infraestructure`: controladores REST, Mongo, bcrypt y JWT.