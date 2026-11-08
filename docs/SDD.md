# Software Design Description

## Propósito

Univalle Shop es una tienda para integrantes de la Universidad del Valle. Este documento registra la arquitectura objetivo y diferencia lo implementado de lo pendiente para evitar presentar scaffolds como microservicios terminados.

La aplicación web esta desarrollada como proyecto académico. Su arquitectura está basada en microservicios y arquitectura hexagonal, utilizando tecnologías como React, Node.js, NestJS y MongoDB.

## Arquitectura

- El frontend consume el API Gateway.
- El gateway enruta solicitudes REST al servicio dueño de cada capacidad.
- Cada microservicio mantiene su propio modelo y base de datos MongoDB; no se comparten colecciones entre servicios.
- En cada servicio, el dominio y los casos de uso dependen de puertos. Los adaptadores HTTP y Mongo implementan las integraciones externas.
- Los servicios se construyen y ejecutan en contenedores Docker coordinados por Compose.

## Estado actual

| Componente | Estado | Persistencia / interfaz |
|---|---|---|
| API Gateway | En implementación | Proxy REST a catálogo, categorías y usuarios |
| Catálogo | MVP ampliado | GET `/products`, GET `/categories`; escritura de productos/categorías solo para administradores; MongoDB independiente (`univalle_catalog`) |
| Usuarios | Registro inicial | POST `/users`, MongoDB independiente |
| Frontend | Catálogo inicial | Vite/React; carrito aún local y sin pedidos |
| Pedidos | Pendiente | Carrito persistente, órdenes e historial |
| Pagos | Pendiente | Proveedor de pagos y manejo seguro de transacciones |
| Búsqueda | Pendiente | Índice y API de búsqueda |
| Recomendación | Pendiente | Perfil de preferencias y API de recomendaciones |

## Reglas y riesgos abiertos

- `UNIVERSITY_EMAIL_DOMAINS` es una lista configurable para filtrar dominios. Un dominio coincidente no demuestra que la persona controle la cuenta ni que siga vinculada a la Universidad. Antes de producción se requiere verificación institucional por correo o integración con identidad/SSO de Univalle.
- Los dominios oficiales aceptados deben confirmarse con el equipo/universidad. No se fija uno por defecto.
- El servicio de usuarios hashea contraseñas y emite JWT al iniciar sesión. Todavía faltan verificación de correo institucional real, recuperación de cuenta y un flujo de administración de roles.
- Las cuentas administradoras se provisionan manualmente; no hay un flujo de autoservicio para otorgar el rol.
- Las escrituras del catálogo validan el JWT y requieren el rol `ADMINISTRADOR`. Este rol se asigna solo en `correos_institucionales` por un operador; la cuenta existente debe volver a iniciar sesión después de su promoción.
- No se debe integrar una pasarela de pago real ni almacenar datos de tarjeta en este proyecto sin definir el proveedor y el alcance de cumplimiento.

## SOLID y pruebas

- Responsabilidad única: cada caso de uso atiende una operación concreta.
- Abierto/cerrado y sustitución de Liskov: adaptadores implementan puertos intercambiables.
- Segregación de interfaces: repositorios y servicios de seguridad exponen contratos pequeños.
- Inversión de dependencias: aplicación/domain no importan Mongo ni HTTP.
- Probar entidades y casos de uso sin Mongo; cubrir adaptadores y rutas con pruebas de integración.

## Seguimiento SDD / Jira

Mantener historias y criterios de aceptación en el tablero Jira del curso. Registrar aquí el enlace al tablero cuando el equipo lo tenga; no hay una URL Jira configurada en el repositorio todavía. Los avances semanales deben enlazar PR/commit con la historia correspondiente.