# Payments Service

Estado: pendiente de implementación; este directorio solo conserva el límite del servicio en Git.

Responsabilidad prevista: coordinar pagos con un proveedor externo y mantener su propio estado transaccional. No almacenar números de tarjeta ni secretos en el repositorio.

Antes de implementar, definir proveedor, flujo de autorización/captura, idempotencia y tratamiento de fallos. Mantener puertos de aplicación separados de los adaptadores del proveedor.