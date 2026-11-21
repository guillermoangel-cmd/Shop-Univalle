import { useEffect, useState, type FormEvent } from 'react'
import {
  getCurrentUser,
  selectCustomerAddress,
  type CustomerAddress,
} from '../../api/usersApi'
import type { CartState, OrderReceipt } from '../../types/cart'
import {
  calculateShippingByDistance,
  calculateShippingForAddress,
} from '../../utils/shippingCalculator'
import './CartPage.css'

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatPrice(value: number): string {
  return copFormatter.format(value).replace(/\s+/g, '')
}

function padTwoDigits(num: number): string {
  return String(num).padStart(2, '0')
}

interface CartPageProps {
  cart: CartState
  cartError: string
  isAuthenticated: boolean
  accessToken: string
  onBackToCatalog: () => void
  onOpenProfile: () => void
  onGoToLogin: () => void
  onLogout: () => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onToggleSelected: (productId: string, selected: boolean) => void
  onToggleFavorite: (productId: string, favorite: boolean) => void
  onRemoveItem: (productId: string) => void
  onClearAll: () => void
  onApplyPromo: (code: string, dynamicShipping?: number) => Promise<void>
  onSyncShippingCost?: (dynamicShipping: number) => Promise<void>
  onCheckout: (
    mode: 'AUTHENTICATED' | 'GUEST',
    deliveryAddress: string,
    dynamicShipping?: number,
  ) => Promise<OrderReceipt | null>
}

type PaymentMethodOption = 'PSE' | 'CARD' | 'CAMPUS_CASH'

function CartPage({
  cart,
  cartError,
  isAuthenticated,
  accessToken,
  onBackToCatalog,
  onOpenProfile,
  onGoToLogin,
  onLogout,
  onUpdateQuantity,
  onToggleSelected,
  onToggleFavorite,
  onRemoveItem,
  onClearAll,
  onApplyPromo,
  onSyncShippingCost,
  onCheckout,
}: CartPageProps) {
  const [promoInput, setPromoInput] = useState(cart.summary.promoCode ?? '')
  const [promoMessage, setPromoMessage] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<OrderReceipt | null>(null)
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>(
    [],
  )
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [addressLoadError, setAddressLoadError] = useState('')
  const [customDistanceOverrideKm, setCustomDistanceOverrideKm] = useState<
    number | null
  >(null)
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodOption>('PSE')

  const selectedAddressObj =
    customerAddresses.find((item) => item.id === selectedAddressId) ?? null
  const baseAddressShipping = calculateShippingForAddress(selectedAddressObj)
  const effectiveDistanceCalc =
    customDistanceOverrideKm !== null
      ? calculateShippingByDistance(
          customDistanceOverrideKm,
          baseAddressShipping.zoneId,
        )
      : baseAddressShipping

  const dynamicShippingCost = effectiveDistanceCalc.shippingCost

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return
    let active = true
    void getCurrentUser(accessToken)
      .then((user) => {
        if (!active) return
        setCustomerAddresses(user.addresses)
        const chosenId = user.selectedAddressId ?? user.addresses[0]?.id ?? ''
        setSelectedAddressId(chosenId)
        setCustomDistanceOverrideKm(null)
      })
      .catch((cause: unknown) => {
        if (active) {
          setCustomerAddresses([])
          setAddressLoadError(
            cause instanceof Error
              ? cause.message
              : 'No se pudieron cargar las direcciones.',
          )
        }
      })
    return () => {
      active = false
    }
  }, [accessToken, isAuthenticated])

  // Sync dynamic distance-based shipping cost with orders-service cart
  useEffect(() => {
    if (!isAuthenticated || !onSyncShippingCost) return
    if (
      cart.summary.totalItems > 0 &&
      cart.summary.estimatedShipping !== dynamicShippingCost
    ) {
      void onSyncShippingCost(dynamicShippingCost)
    }
  }, [
    isAuthenticated,
    dynamicShippingCost,
    cart.summary.totalItems,
    cart.summary.estimatedShipping,
    onSyncShippingCost,
  ])

  const applyCodeDirectly = async (codeToApply: string) => {
    setPromoInput(codeToApply)
    setPromoMessage(null)
    try {
      await onApplyPromo(codeToApply, dynamicShippingCost)
      if (codeToApply.trim()) {
        setPromoMessage({
          type: 'success',
          text: `Cupón ${codeToApply.trim().toUpperCase()} aplicado correctamente al pedido.`,
        })
      } else {
        setPromoMessage({
          type: 'success',
          text: 'Cupón retirado del pedido.',
        })
      }
    } catch (error) {
      setPromoMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'No fue posible aplicar el código.',
      })
    }
  }

  const handlePromoSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await applyCodeDirectly(promoInput)
  }

  const handleProcessCheckout = async (mode: 'AUTHENTICATED' | 'GUEST') => {
    const address = customerAddresses.find(
      (item) => item.id === selectedAddressId,
    )
    if (!address) {
      setPromoMessage({
        type: 'error',
        text: 'Agrega y selecciona una dirección de entrega en tu perfil antes de pagar.',
      })
      return
    }
    setSubmitting(true)
    setPromoMessage(null)
    try {
      const paymentLabel =
        paymentMethod === 'PSE'
          ? 'Pago PSE Institucional'
          : paymentMethod === 'CARD'
            ? 'Tarjeta Débito/Crédito'
            : 'Contraentrega Campus'
      const deliveryAddress = [
        address.label,
        address.address,
        `${effectiveDistanceCalc.distanceKm} km desde Univalle`,
        paymentLabel,
      ]
        .filter(Boolean)
        .join(' · ')
      const createdOrder = await onCheckout(
        mode,
        deliveryAddress,
        dynamicShippingCost,
      )
      if (createdOrder) {
        setLastOrder(createdOrder)
      }
    } catch (error) {
      setPromoMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error al procesar el pedido.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddressSelection = async (addressId: string) => {
    setSelectedAddressId(addressId)
    setCustomDistanceOverrideKm(null)
    if (!addressId || !accessToken) return
    try {
      const result = await selectCustomerAddress(accessToken, addressId)
      setCustomerAddresses(result.addresses)
      setSelectedAddressId(result.selectedAddressId ?? '')
      setPromoMessage(null)
    } catch (error) {
      setPromoMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'No se pudo seleccionar la dirección.',
      })
    }
  }

  const { summary, items } = cart
  const displayedShipping =
    summary.totalItems > 0 ? dynamicShippingCost : 0
  const displayedTaxable = Math.max(0, summary.subtotal - summary.discountAmount)
  const displayedTaxes = Math.round(displayedTaxable * summary.taxRate)
  const displayedTotalFinal =
    summary.totalItems > 0
      ? displayedTaxable + displayedShipping + displayedTaxes
      : 0

  return (
    <div className="uv-cart-page">
      {/* Top Navbar */}
      <header className="uv-topbar">
        <button
          type="button"
          className="uv-brand"
          onClick={onBackToCatalog}
          aria-label="Volver a Tienda Univalle"
        >
          <img
            src="/assets/univalle-logo.png"
            alt="Logo Universidad del Valle"
            className="uv-brand-logo-img"
          />
          <span className="uv-brand-text">TIENDA UNIVALLE</span>
        </button>

        <div className="uv-nav-center">
          <button
            type="button"
            className="uv-catalog-tab"
            onClick={onBackToCatalog}
          >
            CATÁLOGO
          </button>
        </div>

        <div className="uv-nav-right">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className="uv-profile-icon-btn"
                onClick={onOpenProfile}
                aria-label="Mi perfil"
                title="Mi perfil, direcciones e historial de pedidos"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              <button type="button" className="uv-nav-link" onClick={onLogout}>
                CERRAR SESIÓN
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="uv-nav-link"
                onClick={onGoToLogin}
              >
                INICIAR SESIÓN
              </button>
              <button
                type="button"
                className="uv-nav-link"
                onClick={onGoToLogin}
              >
                REGISTRO
              </button>
            </>
          )}

          <button
            type="button"
            className="uv-bag-icon-btn"
            aria-label={`Carrito con ${summary.totalItems} artículos`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {items.length > 0 && <span className="uv-bag-dot" />}
          </button>
        </div>
      </header>

      <main className="uv-cart-container">
        {cartError && (
          <p className="profile-feedback error" role="alert">
            {cartError}
          </p>
        )}

        {/* Order Receipt Banner after checkout */}
        {lastOrder && (
          <div className="uv-order-receipt" role="status">
            <div>
              <h4>¡Pedido {lastOrder.orderNumber} generado exitosamente!</h4>
              <p>
                Modalidad:{' '}
                {lastOrder.checkoutMode === 'AUTHENTICATED'
                  ? 'Integrante Univalle'
                  : 'Invitado'}{' '}
                · {lastOrder.totalItems} artículos · Envío por distancia:{' '}
                <strong>{formatPrice(lastOrder.estimatedShipping)}</strong> ·
                Total: <strong>{formatPrice(lastOrder.totalFinal)}</strong> ·
                Guardado en tu Historial de Pedidos
              </p>
            </div>
            <div className="uv-receipt-actions">
              <button
                type="button"
                className="uv-btn-outline"
                onClick={onOpenProfile}
              >
                Ver en Mi Historial
              </button>
              <button
                type="button"
                className="uv-btn-outline"
                onClick={() => setLastOrder(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div className="uv-cart-grid">
          {/* Left Column: Cart Items */}
          <section aria-label="Productos en el carrito">
            <div className="uv-cart-header">
              <div className="uv-cart-title-group">
                <h1 className="uv-cart-title">CARRITO</h1>
                <span className="uv-cart-count">
                  {padTwoDigits(summary.distinctItemsCount)}
                </span>
              </div>

              {items.length > 0 && (
                <button
                  type="button"
                  className="uv-clear-all-btn"
                  onClick={onClearAll}
                >
                  ELIMINAR TODO
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="uv-empty-cart">
                <h3>Tu carrito está vacío</h3>
                <p>
                  Explora el catálogo institucional, elige tus tallas o productos
                  y agrégalos al carrito.
                </p>
                <div className="uv-empty-actions">
                  <button
                    type="button"
                    className="uv-checkout-primary-btn"
                    style={{
                      width: 'auto',
                      padding: '0 22px',
                      marginBottom: 0,
                    }}
                    onClick={onBackToCatalog}
                  >
                    EXPLORAR CATÁLOGO
                  </button>
                </div>
              </div>
            ) : (
              <div className="uv-cart-items-list">
                {items.map((item) => (
                  <article className="uv-cart-item" key={item.productId}>
                    <input
                      type="checkbox"
                      className="uv-item-checkbox"
                      checked={item.selected}
                      onChange={(e) =>
                        onToggleSelected(item.productId, e.target.checked)
                      }
                      aria-label={`Seleccionar ${item.name}`}
                    />

                    <div className="uv-item-thumb">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                      )}
                    </div>

                    <div className="uv-item-info">
                      <span className="uv-item-category">{item.category}</span>
                      <h2 className="uv-item-name">{item.name}</h2>
                      <p className="uv-item-meta">{item.description}</p>

                      <div className="uv-item-actions">
                        <button
                          type="button"
                          className="uv-icon-action"
                          onClick={() => onRemoveItem(item.productId)}
                          title="Eliminar producto"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className={`uv-icon-action ${item.favorite ? 'active' : ''}`}
                          onClick={() =>
                            onToggleFavorite(item.productId, !item.favorite)
                          }
                          title="Guardar en favoritos"
                          aria-label={`Favorito ${item.name}`}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill={item.favorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="uv-item-right">
                      <span className="uv-item-price">
                        {formatPrice(item.price * item.quantity)}
                      </span>

                      <div className="uv-qty-control">
                        <button
                          type="button"
                          className="uv-qty-btn"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.quantity - 1)
                          }
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          −
                        </button>
                        <span className="uv-qty-value">
                          {padTwoDigits(item.quantity)}
                        </span>
                        <button
                          type="button"
                          className="uv-qty-btn"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.quantity + 1)
                          }
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Summary Card with Distance Shipping, Coupons & Payment Hook */}
          <aside className="uv-summary-card" aria-label="Resumen del pedido">
            <h2 className="uv-summary-title">RESUMEN</h2>

            <div className="uv-summary-rows">
              {/* Delivery Address + Distance Calculator */}
              <div className="uv-delivery-address">
                <div className="uv-delivery-header-row">
                  <strong>Dirección y distancia de envío</strong>
                  <button
                    type="button"
                    className="uv-address-link"
                    onClick={onOpenProfile}
                  >
                    + Gestionar direcciones
                  </button>
                </div>

                {addressLoadError && <p role="alert">{addressLoadError}</p>}

                {customerAddresses.length > 0 ? (
                  <>
                    <select
                      value={selectedAddressId}
                      onChange={(event) =>
                        void handleAddressSelection(event.target.value)
                      }
                      aria-label="Dirección donde recibir el pedido"
                    >
                      {customerAddresses.map((address) => {
                        const calc = calculateShippingForAddress(address)
                        return (
                          <option key={address.id} value={address.id}>
                            {address.label} — {address.address} ({calc.distanceKm}{' '}
                            km · {formatPrice(calc.shippingCost)})
                          </option>
                        )
                      })}
                    </select>

                    {/* Distance Slider / Adjuster showing "More distance = Higher shipping cost" */}
                    <div className="uv-cart-distance-box">
                      <div className="uv-cart-distance-row">
                        <span>
                          Distancia desde Campus Univalle:{' '}
                          <strong>{effectiveDistanceCalc.distanceKm} km</strong>
                        </span>
                        <strong>
                          {formatPrice(effectiveDistanceCalc.shippingCost)}
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="30"
                        step="0.5"
                        className="uv-distance-slider"
                        value={effectiveDistanceCalc.distanceKm}
                        onChange={(e) =>
                          setCustomDistanceOverrideKm(Number(e.target.value))
                        }
                        aria-label="Distancia en kilómetros desde Campus Univalle"
                      />
                      <span className="uv-cart-distance-hint">
                        {effectiveDistanceCalc.zoneName} · A mayor distancia,
                        mayor costo de envío
                      </span>
                    </div>
                  </>
                ) : (
                  <p>
                    No tienes direcciones guardadas. Agrega una dirección en tu
                    perfil para calcular el envío.
                  </p>
                )}
              </div>

              <div className="uv-summary-row">
                <span>Total Items</span>
                <strong>{summary.totalItems} Items</strong>
              </div>
              <div className="uv-summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(summary.subtotal)}</strong>
              </div>
              {summary.discountAmount > 0 && (
                <div className="uv-summary-row discount">
                  <span>Descuento ({summary.promoCode})</span>
                  <strong>-{formatPrice(summary.discountAmount)}</strong>
                </div>
              )}
              <div className="uv-summary-row">
                <span>
                  Est. Envío ({effectiveDistanceCalc.distanceKm} km)
                </span>
                <strong>{formatPrice(displayedShipping)}</strong>
              </div>
              <div className="uv-summary-row tax">
                <span>Impuestos (19%)</span>
                <strong>+{formatPrice(displayedTaxes)}</strong>
              </div>
            </div>

            <div className="uv-summary-total-row">
              <span className="uv-summary-total-label">Total final</span>
              <strong className="uv-summary-total-value">
                {formatPrice(displayedTotalFinal)}
              </strong>
            </div>

            {/* Promo Code Form + Quick Coupon Chips */}
            <form className="uv-promo-form" onSubmit={handlePromoSubmit}>
              <input
                type="text"
                className="uv-promo-input"
                placeholder="Código promo (ej. UNIVALLE10)"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                aria-label="Código promocional"
              />
              <button type="submit" className="uv-promo-btn">
                APLICAR
              </button>
            </form>

            <div className="uv-promo-chips-bar">
              <span>Cupones UV:</span>
              <button
                type="button"
                className={`uv-promo-chip ${summary.promoCode === 'UNIVALLE10' ? 'active' : ''}`}
                onClick={() => void applyCodeDirectly('UNIVALLE10')}
              >
                UNIVALLE10 (-10%)
              </button>
              <button
                type="button"
                className={`uv-promo-chip ${summary.promoCode === 'UV2026' ? 'active' : ''}`}
                onClick={() => void applyCodeDirectly('UV2026')}
              >
                UV2026 (-15%)
              </button>
              {summary.promoCode && (
                <button
                  type="button"
                  className="uv-promo-chip clear"
                  onClick={() => void applyCodeDirectly('')}
                >
                  Quitar
                </button>
              )}
            </div>

            {promoMessage && (
              <p className={`uv-promo-feedback ${promoMessage.type}`}>
                {promoMessage.text}
              </p>
            )}

            {/* Payment Method Selector (Ready for Payments Microservice) */}
            <div className="uv-payment-methods-box">
              <span className="uv-payment-methods-label">
                MÉTODO DE PAGO (MÓDULO DE TRANSACCIONES)
              </span>
              <div className="uv-payment-options">
                <button
                  type="button"
                  className={`uv-payment-opt ${paymentMethod === 'PSE' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('PSE')}
                >
                  PSE Institucional
                </button>
                <button
                  type="button"
                  className={`uv-payment-opt ${paymentMethod === 'CARD' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  Tarjeta
                </button>
                <button
                  type="button"
                  className={`uv-payment-opt ${paymentMethod === 'CAMPUS_CASH' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('CAMPUS_CASH')}
                >
                  Contraentrega UV
                </button>
              </div>
            </div>

            <button
              type="button"
              className="uv-checkout-primary-btn"
              disabled={summary.totalItems === 0 || submitting}
              onClick={() => void handleProcessCheckout('AUTHENTICATED')}
            >
              {submitting ? 'PROCESANDO...' : 'PROCEDER AL PAGO'}
            </button>

            <button
              type="button"
              className="uv-checkout-guest-btn"
              disabled={summary.totalItems === 0 || submitting}
              onClick={() => void handleProcessCheckout('GUEST')}
            >
              CHECKOUT COMO INVITADO
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default CartPage
