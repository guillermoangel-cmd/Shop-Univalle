
# Base de datos - User Service

## 1. Información general

**Base de datos:** `univalle_users`

**Motor:** MongoDB

**Microservicio:** User Service

**Responsabilidad:** Gestionar la identidad, autorización institucional y autenticación de los usuarios de Univalle Shop.

## 2. Colecciones

### 2.1 correos_institucionales

Almacena los correos institucionales autorizados para utilizar la plataforma.

| Campo | Tipo | Descripción |
|---|---|---|
| _id | ObjectId | Identificador del registro |
| email | String | Correo institucional |
| nombre | String | Nombre del usuario |
| apellido | String | Apellido del usuario |
| rol | String | Perfil universitario |
| authorized | Boolean | Indica si está autorizado |

### 2.2 usuarios

Almacena las cuentas creadas en la aplicación.

| Campo | Tipo | Descripción |
|---|---|---|
| _id | ObjectId | Identificador del usuario |
| nombre | String | Nombre completo |
| email | String | Correo institucional |
| passwordHash | String | Hash de la contraseña |
| rol | String | Perfil del usuario |
| estado | String | Estado de la cuenta |
| emailVerified | Boolean | Indica si se verificó el correo |
| createdAt | Date | Fecha de creación |
| updatedAt | Date | Fecha de actualización |

## 3. Reglas de negocio

- Solamente se permiten correos institucionales autorizados.
- Un correo no puede tener más de una cuenta.
- Las contraseñas deben almacenarse mediante hashes seguros.
- Los usuarios deben tener un rol institucional válido.
- Las cuentas inactivas no pueden iniciar sesión.

## 4. Proceso de creación de cuenta

1. El usuario proporciona su correo institucional.
2. El sistema consulta la colección correos_institucionales.
3. Comprueba que el correo exista y esté autorizado.
4. Verifica que no exista una cuenta previa.
5. El usuario establece su contraseña.
6. El sistema genera un hash seguro.
7. Se crea el documento en usuarios.
