# Orders Service – Univalle Shop

Microservicio encargado de gestionar el **Carrito de Compras persistente**, la **creación de órdenes (Checkout)** y el **historial de compras**, implementado con **NestJS**, **MongoDB** (`univalle_orders`) y **Arquitectura Hexagonal + Principios SOLID**.

## Estructura Hexagonal

```text
src/orders/
├── domain/
│   ├── entities/        # CartItemEntity, CartEntity, OrderEntity (lógica de negocio pura)
│   └── ports/           # CartRepository, OrderRepository (interfaces desacopladas)
├── application/
│   └── use-cases/       # GetCart, AddCartItem, UpdateCartItem, RemoveCartItem, ClearCart, ApplyPromoCode, CheckoutOrder, ListOrders
└── infrastructure/
    ├── adapters/        # CartMongoRepositoryAdapter, OrderMongoRepositoryAdapter
    ├── persistence/     # Esquemas Mongoose para colecciones 'carts' y 'orders'
    └── http/            # OrdersController (REST API)
```

## Endpoints Principales (Puerto local: `3004`)

- `GET /cart?userId=<id>` – Consultar carrito e importes calculados (subtotal, envío, IVA 19%, total final).
- `POST /cart/items` – Añadir producto o incrementar cantidad en el carrito.
- `PATCH /cart/items/:productId` – Actualizar cantidad, selección (`selected`) o favorito (`favorite`).
- `DELETE /cart/items/:productId?userId=<id>` – Eliminar un producto del carrito.
- `DELETE /cart?userId=<id>` – Vaciar el carrito (`ELIMINAR TODO`).
- `POST /cart/promo` – Aplicar código promocional (`UNIVALLE10`, `UNIVALLE20`, `UV75`).
- `POST /orders/checkout` – Procesar pedido (`PROCEDER AL PAGO` / `CHECKOUT COMO INVITADO`).
- `GET /orders?userId=<id>` – Consultar historial de órdenes creadas.
