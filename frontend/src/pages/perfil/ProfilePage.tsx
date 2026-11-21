import { useEffect, useState, type FormEvent } from 'react'
import { fetchCustomerOrders } from '../../api/ordersApi'
import {
  addCustomerAddress,
  deleteCustomerAddress,
  getCurrentUser,
  getMyProfile,
  selectCustomerAddress,
  updateMyProfile,
  type CurrentUser,
  type StoreProfile,
} from '../../api/usersApi'
import type { OrderReceipt } from '../../types/cart'
import {
  UNIVALLE_SHIPPING_ZONES,
  calculateShippingByDistance,
  calculateShippingForAddress,
  formatAddressDetailsWithDistance,
} from '../../utils/shippingCalculator'
import '../catalogo/CatalogPage.css'

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatPrice(value: number): string {
  return copFormatter.format(value).replace(/\s+/g, '')
}

interface ProfilePageProps {
  accessToken: string
  userId?: string
  userName?: string
  userEmail?: string
  role?: string
  bagCount?: number
  initialTab?: ProfileSectionTab
  onBack: () => void
  onOpenProfile?: () => void
  onOpenHistory?: () => void
  onOpenCart?: () => void
  onOpenManage?: () => void
  onOpenModeration?: () => void
  onLogout: () => void
}

type ProfileSectionTab = 'account' | 'orders'

function ProfilePage({
  accessToken,
  userId = '',
  userName = 'Usuario',
  userEmail = '',
  role = 'ESTUDIANTE',
  bagCount = 0,
  initialTab = 'account',
  onBack,
  onOpenProfile,
  onOpenHistory,
  onOpenCart,
  onOpenManage,
  onOpenModeration,
  onLogout,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileSectionTab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null)
  const [orders, setOrders] = useState<OrderReceipt[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [nickname, setNickname] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [shippingCost, setShippingCost] = useState('0')

  // Delivery address creation with distance calculation
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [details, setDetails] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState('zona-sur')
  const [distanceKm, setDistanceKm] = useState(3.5)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isAdmin = role === 'ADMINISTRATIVO' || role === 'ADMINISTRADOR'
  const roleLabel = isAdmin
    ? 'Administrador'
    : role === 'DOCENTE'
      ? 'Docente'
      : 'Estudiante'

  const liveAddressShipping = calculateShippingByDistance(
    distanceKm,
    selectedZoneId,
  )

  useEffect(() => {
    let active = true
    Promise.all([getCurrentUser(accessToken), getMyProfile(accessToken)])
      .then(([currentUserData, myProfileData]) => {
        if (!active) return
        setUser(currentUserData)
        setStoreProfile(myProfileData)
        setNickname(myProfileData.nickname)
        setStoreAddress(myProfileData.address || '')
        setShippingCost(String(myProfileData.shippingCost))
        setError('')

        const effectiveUserId = currentUserData.id || userId
        if (effectiveUserId) {
          setOrdersLoading(true)
          void fetchCustomerOrders(effectiveUserId, accessToken)
            .then((orderList) => {
              if (active) setOrders(Array.isArray(orderList) ? orderList : [])
            })
            .catch(() => {
              if (active) setOrders([])
            })
            .finally(() => {
              if (active) setOrdersLoading(false)
            })
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'No se pudo cargar tu perfil.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [accessToken, userId])

  async function saveStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updatedStore = await updateMyProfile(accessToken, {
        nickname: nickname.trim(),
        address: storeAddress.trim(),
        shippingCost: Number(shippingCost),
      })
      setStoreProfile(updatedStore)
      setMessage('Configuración de tu tienda actualizada correctamente.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo actualizar tu tienda.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const formattedDetails = formatAddressDetailsWithDistance(
        details.trim(),
        selectedZoneId,
        distanceKm,
      )
      const result = await addCustomerAddress(accessToken, {
        label: label.trim(),
        address: address.trim(),
        details: formattedDetails,
      })
      setUser((current) =>
        current
          ? {
              ...current,
              addresses: result.addresses,
              selectedAddressId: result.selectedAddressId,
            }
          : current,
      )
      setLabel('')
      setAddress('')
      setDetails('')
      setMessage(
        `Dirección agregada con tarifa por distancia (${liveAddressShipping.distanceKm} km → ${formatPrice(liveAddressShipping.shippingCost)}).`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo guardar la dirección.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function selectAddress(addressId: string) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await selectCustomerAddress(accessToken, addressId)
      setUser((current) =>
        current
          ? {
              ...current,
              addresses: result.addresses,
              selectedAddressId: result.selectedAddressId,
            }
          : current,
      )
      setMessage('Dirección predeterminada seleccionada para tus pedidos.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo seleccionar la dirección.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteAddress(addressId: string) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await deleteCustomerAddress(accessToken, addressId)
      setUser((current) =>
        current
          ? {
              ...current,
              addresses: result.addresses,
              selectedAddressId: result.selectedAddressId,
            }
          : current,
      )
      setMessage('Dirección eliminada de tu perfil.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo eliminar la dirección.',
      )
    } finally {
      setSaving(false)
    }
  }

  const displayName = user?.name || userName
  const displayEmail = user?.email || userEmail

  return (
    <div className="uv-catalog-page">
      {/* Unified Top Header */}
      <header className="uv-catalog-header">
        <button type="button" className="uv-header-brand" onClick={onBack}>
          <img
            src="/assets/univalle-logo.png"
            alt="Logo Universidad del Valle"
            className="uv-header-logo-img"
          />
          <span className="uv-header-title">TIENDA UNIVALLE</span>
        </button>

        <div className="uv-header-center">
          <button type="button" className="uv-header-tab" onClick={onBack}>
            CATÁLOGO
          </button>
          <button
            type="button"
            className={`uv-header-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('account')
              onOpenProfile?.()
            }}
          >
            MI PERFIL
          </button>
          <button
            type="button"
            className={`uv-header-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('orders')
              onOpenHistory?.()
            }}
          >
            HISTORIAL ({orders.length})
          </button>
          {onOpenManage && (
            <button
              type="button"
              className="uv-header-tab"
              onClick={onOpenManage}
            >
              GESTIÓN
            </button>
          )}
          {isAdmin && onOpenModeration && (
            <button
              type="button"
              className="uv-header-tab"
              onClick={onOpenModeration}
            >
              MODERACIÓN
            </button>
          )}
        </div>

        <div className="uv-header-right">
          <span className={`uv-role-pill ${isAdmin ? 'admin' : ''}`}>
            {roleLabel} · {displayName}
          </span>

          <button
            type="button"
            className="uv-header-icon-btn active"
            aria-label="Mi perfil"
            title="Estás en tu perfil"
            onClick={() => setActiveTab('account')}
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

          {onOpenCart && (
            <button
              type="button"
              className="uv-header-bag-btn"
              onClick={onOpenCart}
              aria-label={`Ver carrito con ${bagCount} artículos`}
              title="Abrir carrito de compras"
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
              {bagCount > 0 ? (
                <span className="uv-header-bag-count">{bagCount}</span>
              ) : (
                <span className="uv-header-bag-dot" />
              )}
            </button>
          )}

          <button type="button" className="uv-header-link" onClick={onLogout}>
            CERRAR SESIÓN
          </button>
        </div>
      </header>

      <main className="uv-catalog-main">
        {/* Profile Hero */}
        <div className="uv-subpage-hero">
          <div className="uv-profile-identity">
            <div className="uv-profile-avatar">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="uv-subpage-eyebrow">
                CUENTA INSTITUCIONAL · {roleLabel.toUpperCase()}
              </p>
              <h1 className="uv-subpage-title">{displayName}</h1>
              <p className="uv-subpage-desc">
                {displayEmail || 'Comunidad Universidad del Valle'} · Administra
                tu tienda y tus direcciones con cálculo de envío por distancia.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="uv-empty-catalog">
            <strong>Cargando información de tu perfil...</strong>
          </div>
        )}

        {error && (
          <div className="uv-crud-feedback error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="uv-crud-feedback" role="status">
            <span>{message}</span>
            <button
              type="button"
              className="uv-crud-feedback-close"
              onClick={() => setMessage('')}
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: STORE PROFILE & DELIVERY ADDRESSES WITH DISTANCE CALCULATOR */}
        {activeTab === 'account' && user && storeProfile && (
          <div className="uv-crud-forms-grid">
            {/* Store Profile Configuration Card */}
            <section
              className="uv-crud-card"
              aria-labelledby="store-profile-title"
            >
              <div className="uv-crud-card-header">
                <h2 id="store-profile-title">Mi Perfil de Vendedor / Tienda</h2>
                <span
                  className={`uv-status-badge ${storeProfile.active ? 'active' : 'inactive'}`}
                >
                  {storeProfile.active ? 'Tienda Activa' : 'Tienda Inactiva'}
                </span>
              </div>

              <p className="uv-profile-card-note">
                Este nombre o apodo se muestra públicamente como{' '}
                <strong>Vendedor</strong> en cada uno de los productos que
                publiques en el catálogo.
              </p>

              <form className="uv-profile-form-stack" onSubmit={saveStore}>
                <label className="uv-crud-field">
                  <span>Apodo / Nombre público de tu tienda</span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Ej. Librería Ingeniería UV / Tienda de Juan"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                  />
                </label>

                <label className="uv-crud-field">
                  <span>Ubicación o sede de despacho en Univalle</span>
                  <input
                    maxLength={180}
                    placeholder="Ej. Campus Meléndez · Edificio E20"
                    value={storeAddress}
                    onChange={(event) => setStoreAddress(event.target.value)}
                  />
                </label>

                <label className="uv-crud-field">
                  <span>Tarifa base de despacho (COP)</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={shippingCost}
                    onChange={(event) => setShippingCost(event.target.value)}
                  />
                </label>

                <div className="uv-profile-shipping-preview">
                  <span>Vendedor visible en catálogo como:</span>
                  <strong>{nickname || displayName}</strong>
                </div>

                <button
                  className="uv-crud-btn primary full"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar Perfil de Tienda'}
                </button>
              </form>
            </section>

            {/* Delivery Addresses Card with Distance Shipping Logic */}
            <section className="uv-crud-card" aria-labelledby="addresses-title">
              <div className="uv-crud-card-header">
                <h2 id="addresses-title">
                  Mis Direcciones de Entrega (Tarifa por Distancia)
                </h2>
                <span>{user.addresses.length} registradas</span>
              </div>

              <form className="uv-profile-form-stack" onSubmit={createAddress}>
                <div className="uv-crud-grid-2">
                  <label className="uv-crud-field">
                    <span>Etiqueta</span>
                    <input
                      required
                      maxLength={40}
                      placeholder="Casa, Campus Meléndez, Apto"
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                    />
                  </label>
                  <label className="uv-crud-field">
                    <span>Dirección de entrega</span>
                    <input
                      required
                      maxLength={180}
                      placeholder="Calle 13 # 100-00 / Cra 80 # 16-20"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </label>
                </div>

                {/* Distance & Zone Selector from Univalle */}
                <div className="uv-distance-calc-box">
                  <div className="uv-crud-grid-2">
                    <label className="uv-crud-field">
                      <span>Zona de destino respecto a Univalle</span>
                      <select
                        value={selectedZoneId}
                        onChange={(e) => {
                          const nextZoneId = e.target.value
                          setSelectedZoneId(nextZoneId)
                          const z = UNIVALLE_SHIPPING_ZONES.find(
                            (item) => item.id === nextZoneId,
                          )
                          if (z) setDistanceKm(z.defaultDistanceKm)
                        }}
                      >
                        {UNIVALLE_SHIPPING_ZONES.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name} (~{z.defaultDistanceKm} km)
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="uv-crud-field">
                      <span>Distancia estimada desde Univalle (km)</span>
                      <input
                        type="number"
                        min="0.5"
                        max="45"
                        step="0.5"
                        value={distanceKm}
                        onChange={(e) =>
                          setDistanceKm(Math.max(0.5, Number(e.target.value)))
                        }
                      />
                    </label>
                  </div>

                  <div className="uv-distance-calc-result">
                    <span>
                      A mayor distancia del campus, mayor valor de envío (
                      <strong>{liveAddressShipping.distanceKm} km</strong>):
                    </span>
                    <strong>
                      Envío estimado:{' '}
                      {formatPrice(liveAddressShipping.shippingCost)}
                    </strong>
                  </div>
                </div>

                <label className="uv-crud-field">
                  <span>Punto de referencia / Portería (opcional)</span>
                  <input
                    maxLength={140}
                    placeholder="Edificio E20, oficina 204, conjunto residencial..."
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                  />
                </label>

                <button
                  className="uv-crud-btn secondary full"
                  type="submit"
                  disabled={saving}
                >
                  + Agregar Dirección con Tarifa de Envío
                </button>
              </form>

              <div className="uv-address-list">
                {user.addresses.length === 0 ? (
                  <p className="uv-crud-empty">
                    Aún no tienes direcciones registradas. Agrega una para
                    calcular el envío según la distancia y finalizar tus compras.
                  </p>
                ) : (
                  user.addresses.map((item) => {
                    const selected = user.selectedAddressId === item.id
                    const addrShipping = calculateShippingForAddress(item)
                    return (
                      <article
                        className={`uv-address-card ${selected ? 'selected' : ''}`}
                        key={item.id}
                      >
                        <div className="uv-address-card-info">
                          <div className="uv-address-card-top">
                            <strong>{item.label}</strong>
                            {selected && (
                              <span className="uv-status-badge active">
                                Predeterminada
                              </span>
                            )}
                            <span className="uv-address-shipping-pill">
                              {addrShipping.distanceKm} km · Envío:{' '}
                              {formatPrice(addrShipping.shippingCost)}
                            </span>
                          </div>
                          <p>{item.address}</p>
                          {item.details && <span>{item.details}</span>}
                        </div>

                        <div className="uv-crud-row-actions">
                          {!selected && (
                            <button
                              className="uv-crud-btn secondary"
                              type="button"
                              disabled={saving}
                              onClick={() => void selectAddress(item.id)}
                            >
                              Elegir
                            </button>
                          )}
                          <button
                            className="uv-crud-btn danger"
                            type="button"
                            disabled={saving}
                            onClick={() => void deleteAddress(item.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: ORDER HISTORY (HISTORIAL DE PEDIDOS) */}
        {activeTab === 'orders' && (
          <section
            className="uv-crud-section"
            aria-labelledby="order-history-heading"
          >
            <div className="uv-crud-section-header">
              <div>
                <h2 id="order-history-heading">
                  Historial de Mis Pedidos ({orders.length})
                </h2>
                <span>
                  Registro histórico de compras procesadas en el microservicio
                  de órdenes (orders-service)
                </span>
              </div>
              {onOpenCart && (
                <button
                  type="button"
                  className="uv-crud-btn secondary"
                  onClick={onOpenCart}
                >
                  Ir a Mi Carrito Actual →
                </button>
              )}
            </div>

            {ordersLoading ? (
              <div className="uv-empty-catalog">
                <strong>Consultando historial de pedidos...</strong>
              </div>
            ) : orders.length === 0 ? (
              <div className="uv-empty-catalog">
                <strong>Aún no has realizado pedidos</strong>
                <p>
                  Cuando agregues productos al carrito y completes un pedido,
                  aparecerá aquí con todo su desglose de productos, envío por
                  distancia e impuestos.
                </p>
              </div>
            ) : (
              <div className="uv-orders-history-list">
                {orders.map((order) => {
                  const formattedDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleString('es-CO', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Reciente'

                  return (
                    <article
                      className="uv-order-history-card"
                      key={order.id ?? order.orderNumber}
                    >
                      <div className="uv-order-history-header">
                        <div>
                          <span className="uv-order-number-badge">
                            ORDEN #{order.orderNumber}
                          </span>
                          <span className="uv-order-date">
                            Realizado el {formattedDate}
                          </span>
                        </div>
                        <div className="uv-order-header-right">
                          <span className="uv-status-badge active">
                            {order.status === 'PAID'
                              ? 'PAGADO'
                              : 'CONFIRMADO · PENDIENTE PAGO'}
                          </span>
                          <strong className="uv-order-total-highlight">
                            {formatPrice(order.totalFinal)}
                          </strong>
                        </div>
                      </div>

                      <div className="uv-order-delivery-bar">
                        <span>
                          <strong>Dirección de entrega:</strong>{' '}
                          {order.deliveryAddress}
                        </span>
                        {order.promoCode && (
                          <span className="uv-role-pill admin">
                            Cupón aplicado: {order.promoCode}
                          </span>
                        )}
                      </div>

                      <div className="uv-order-items-table">
                        {order.items.map((item, idx) => (
                          <div
                            className="uv-order-history-item"
                            key={`${item.productId}-${idx}`}
                          >
                            <div className="uv-order-history-item-main">
                              <strong>{item.name}</strong>
                              <span>
                                {item.category}
                                {item.description
                                  ? ` · ${item.description}`
                                  : ''}
                              </span>
                            </div>
                            <div className="uv-order-history-item-numbers">
                              <span>
                                {item.quantity} x {formatPrice(item.price)}
                              </span>
                              <strong>
                                {formatPrice(
                                  item.lineTotal ?? item.price * item.quantity,
                                )}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="uv-order-financial-footer">
                        <span>
                          Subtotal: <strong>{formatPrice(order.subtotal)}</strong>
                        </span>
                        {order.discountAmount > 0 && (
                          <span className="uv-discount-text">
                            Descuento:{' '}
                            <strong>-{formatPrice(order.discountAmount)}</strong>
                          </span>
                        )}
                        <span>
                          Envío (por distancia):{' '}
                          <strong>{formatPrice(order.estimatedShipping)}</strong>
                        </span>
                        <span>
                          IVA (19%): <strong>+{formatPrice(order.taxes)}</strong>
                        </span>
                        <span className="uv-order-final-sum">
                          Total Final:{' '}
                          <strong>{formatPrice(order.totalFinal)}</strong>
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default ProfilePage
