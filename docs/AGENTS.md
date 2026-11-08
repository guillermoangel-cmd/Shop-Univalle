
# Instrucciones para asistentes de IA - Univalle Shop

> **Alcance:** al estar ubicado en `docs/AGENTS.md`, este archivo da instrucciones
> principalmente para los documentos dentro de `docs/`; no sustituye instrucciones
> globales en la raíz del repositorio. Si estas reglas deben aplicarse a todo el
> proyecto, el equipo deberá decidir si las traslada a un `AGENTS.md` en la raíz.

## 1. Contexto del proyecto

Univalle Shop es una tienda virtual desarrollada exclusivamente para
la comunidad de la Universidad del Valle.

Está dirigida a:
- Estudiantes.
- Docentes.
- Personal administrativo.

### Tecnologías principales

- Backend: Node.js.
- Frontend: React.js.
- Lenguaje: TypeScript
- Base de datos: MongoDB.
- ODM: Mongoose, donde esté implementado.
- Arquitectura: Microservicios y arquitectura hexagonal.
- Contenedores: Docker.
- Comunicación: API RESTful.

### Microservicios

- **Implementados y presentes en Compose:** `frontend`, `api-gateway`,
  `services/catalog-service` y `services/user-service`.
- **Planeados o pendientes según el README:** `orders-service`,
  `payments-service`, `search-service` y `recommendation-service`.

La estructura puede cambiar. Antes de trabajar en un componente, comprueba su
código, `package.json`, configuración de Compose y documentación; una carpeta
con el nombre de un servicio no implica que su funcionalidad esté implementada.
El estado y los contratos conocidos se describen en [README.md](../README.md) y
[SDD.md](SDD.md); actualízalos cuando el cambio los deje desactualizados.

El frontend ya contiene páginas de catálogo e inicio de sesión. El gateway
encamina solicitudes a los servicios de catálogo y usuarios. Verifica los
endpoints y sus contratos en el código antes de asumir rutas o comportamientos.

## 2. Reglas generales de desarrollo

1. Antes de modificar código, analiza la estructura existente.
2. Revisa los archivos relacionados con la funcionalidad solicitada.
3. Respeta las tecnologías y dependencias actualmente utilizadas.
4. Mantén la arquitectura hexagonal y los principios SOLID.
5. Evita duplicar lógica y responsabilidades.
6. Reutiliza componentes, servicios, entidades y funciones existentes.
7. Implementa cambios pequeños, organizados y coherentes.
8. No realices refactorizaciones generales cuando solo se solicita
   una modificación específica.
9. Comprueba los scripts disponibles en el `package.json` del componente antes
   de proponer o ejecutar comandos; no supongas que todos tienen las mismas
   pruebas, scripts o herramientas.

## 3. Protección del código existente

1. No elimines archivos ni funcionalidades sin justificación.
2. No reemplaces archivos completos cuando sea suficiente modificar
   una sección.
3. No modifiques código que no esté relacionado con la solicitud.
4. No cambies contratos de API sin revisar sus dependencias.
5. No modifiques configuraciones de Docker, variables de entorno
   o dependencias sin una necesidad justificada.
6. No sobrescribas información existente sin comprobar sus efectos.
7. Antes de realizar cambios estructurales importantes, explica
   qué archivos serán modificados y por qué.

## 4. Arquitectura hexagonal

Mantén separadas las responsabilidades:

- Domain: entidades, reglas de negocio y objetos de dominio.
- Application: casos de uso y puertos.
- Infrastructure: persistencia, conexiones y adaptadores externos.
- Presentation: controladores, DTO y exposición de endpoints.

Las reglas de negocio no deben depender directamente de MongoDB,
Mongoose, NestJS ni de otros detalles de infraestructura.

Las implementaciones deben respetar las dependencias establecidas
por la arquitectura del proyecto.

Usa como referencia la organización que ya existe en cada servicio. Por
ejemplo, el catálogo separa `application`, `domain` e `infrastructure`; en
usuarios, revisa los nombres de carpetas existentes antes de crear o mover
archivos. No hagas cambios de nombres o estructura como parte de una tarea
funcional si no son necesarios.

## 5. Bases de datos

1. Utiliza MongoDB según la configuración de cada microservicio.
2. Respeta los nombres actuales de las bases de datos y colecciones.
3. Mantén separados los Schemas, las entidades de dominio y los
   documentos de persistencia.
4. Documenta los cambios importantes en la estructura de datos.
5. Evita eliminar o modificar registros sin autorización.
6. Utiliza Seeds únicamente para información inicial o de prueba.
7. Evita duplicar registros al ejecutar los Seeds varias veces.
8. Nunca almacenes contraseñas en texto plano.

### User Service

Base de datos: univalle_users.

Colecciones:
- correos_institucionales.
- usuarios.

Solo se permite la creación de cuentas con correos institucionales
previamente autorizados.

No confundas permitir dominios institucionales con verificar que una persona
controla una cuenta o pertenece actualmente a la Universidad. Comprueba qué
validación implementa el servicio y conserva explícita esta limitación en la
documentación hasta que exista verificación institucional.

Roles:
- ESTUDIANTE.
- DOCENTE.
- ADMINISTRATIVO.

## 6. Frontend

1. Respeta la estructura actual de React.
2. Reutiliza componentes y estilos existentes.
3. Mantén separadas las responsabilidades de las páginas,
   componentes, servicios y lógica de negocio.
4. Conserva la identidad visual de Univalle Shop.
5. Diseña interfaces responsivas y accesibles.
6. Evita duplicar llamadas a la API y lógica de validación.

## 7. Documentación

Cuando se implementen funcionalidades importantes:

- Actualiza el README cuando corresponda.
- Documenta endpoints y contratos de API.
- Actualiza la documentación de las bases de datos.
- Documenta variables de entorno mediante archivos .env.example.
- Mantén actualizados los diagramas y documentos técnicos afectados.

No reemplaces documentación existente sin revisar su contenido.

## 8. Seguridad

- No expongas contraseñas ni tokens.
- No incluyas archivos .env en Git.
- Valida los datos recibidos por las API.
- Protege los endpoints que requieran autenticación.
- No confíes únicamente en las validaciones del frontend.
- No expongas información sensible en las respuestas.
- No consideres una cuenta autenticada como autorizada para cualquier acción;
  comprueba autenticación y permisos en el backend para cada operación protegida.
- No expongas endpoints de escritura administrativa ni integres pagos reales sin
  los controles, proveedor y alcance de seguridad correspondientes.

## 9. Pruebas y validaciones

Después de implementar cambios:

1. Comprueba que los archivos modificados no tengan errores.
2. Ejecuta las pruebas disponibles del servicio afectado.
3. Comprueba que las integraciones relacionadas sigan funcionando.
4. No afirmes que las pruebas fueron exitosas si no se ejecutaron.
5. Informa cualquier error o limitación detectada.
6. Usa los scripts del componente: el frontend dispone de `npm run lint` y
   `npm run build`; gateway y servicios activos definen scripts como
   `npm run lint`, `npm test`, `npm run test:e2e` y `npm run build`. Confirma en
   cada `package.json` cuáles aplican al cambio.
7. Para cambios de endpoints o integración entre componentes, prioriza también
   las pruebas de integración o e2e disponibles, no solo las pruebas unitarias.

## 10. Git y control de versiones

1. No trabajes directamente sobre main.
2. Respeta la rama actual del desarrollador.
3. No realices commits, push, merges o cambios de rama sin
   una solicitud explícita.
4. No elimines cambios locales existentes.
5. No sobrescribas trabajo realizado por otros integrantes.

## 11. Forma de trabajar

Antes de implementar una solicitud:

1. Analiza el código existente.
2. Identifica los archivos involucrados.
3. Comprueba cómo se relaciona la funcionalidad con el resto
   del proyecto.
4. Explica los cambios importantes que propones (de ser necesario).

Durante la implementación:

- Trabaja de manera incremental.
- Respeta la organización existente.
- Evita modificaciones innecesarias.

Al finalizar:

- Resume los cambios realizados.
- Enumera los archivos modificados.
- Explica cómo probar la funcionalidad.
- Indica los comandos necesarios para ejecutar las pruebas.
- Informa cualquier decisión técnica importante.
