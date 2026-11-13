import { useEffect, useState, type FormEvent } from 'react'
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
import '../catalogo/CatalogPage.css'

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface ProfilePageProps {
  accessToken: string
  userName?: string
  userEmail?: string
  role?: string
  bagCount?: number
  onBack: () => void
  onOpenCart?: () => void
  onOpenManage?: () => void
  onLogout: () => void
}

function ProfilePage({
  accessToken,
  userName = 'Usuario',
  userEmail = '',
  role = 'ESTUDIANTE',
  bagCount = 0,
  onBack,
  onOpenCart,
  onOpenManage,
  onLogout,
}: ProfilePageProps) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null)
  const [nickname, setNickname] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [shippingCost, setShippingCost] = useState('0')
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [details, setDetails] = useState('')
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
  }, [accessToken])

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
      const result = await addCustomerAddress(accessToken, {
        label: label.trim(),
        address: address.trim(),
        details: details.trim(),
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
      setMessage('Dirección agregada a tu libreta de entregas.')
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
          <button type="button" className="uv-header-tab active">
            MI PERFIL
          </button>
          {onOpenManage && (
            <button
              type="button"
              className="uv-header-tab"
              onClick={onOpenManage}
            >
              GESTIÓN CRUD
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
                los datos de tu tienda y tus direcciones de entrega.
              </p>
            </div>
          </div>

          <div className="uv-admin-toolbar-actions">
            {onOpenManage && (
              <button
                type="button"
                className="uv-admin-btn primary"
                onClick={onOpenManage}
              >
                Ir a Gestión de Productos (CRUD)
              </button>
            )}
            <button type="button" className="uv-admin-btn" onClick={onBack}>
              ← Volver al Catálogo
            </button>
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

        {user && storeProfile && (
          <div className="uv-crud-forms-grid">
            {/* Store Profile Configuration Card */}
            <section className="uv-crud-card" aria-labelledby="store-profile-title">
              <div className="uv-crud-card-header">
                <h2 id="store-profile-title">Mi Perfil de Tienda</h2>
                <span
                  className={`uv-status-badge ${storeProfile.active ? 'active' : 'inactive'}`}
                >
                  {storeProfile.active ? 'Tienda Activa' : 'Tienda Inactiva'}
                </span>
              </div>

              <p className="uv-profile-card-note">
                Define el nombre visible de tu tienda en el catálogo, su ubicación
                de despacho y la tarifa base de envío para tus compradores.
              </p>

              <form className="uv-profile-form-stack" onSubmit={saveStore}>
                <label className="uv-crud-field">
                  <span>Apodo / Nombre comercial de tu tienda</span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Ej. Librería Ingeniería UV"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                  />
                </label>

                <label className="uv-crud-field">
                  <span>Dirección o punto de despacho de la tienda</span>
                  <input
                    maxLength={180}
                    placeholder="Ej. Campus Meléndez · Edificio E20"
                    value={storeAddress}
                    onChange={(event) => setStoreAddress(event.target.value)}
                  />
                </label>

                <label className="uv-crud-field">
                  <span>Tarifa de envío estimada (COP)</span>
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
                  <span>Tarifa actual aplicada a tus compradores:</span>
                  <strong>
                    {copFormatter
                      .format(Number(shippingCost || 0))
                      .replace(/\s+/g, '')}
                  </strong>
                </div>

                <button
                  className="uv-crud-btn primary full"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar Configuración de Tienda'}
                </button>
              </form>
            </section>

            {/* Delivery Addresses Card */}
            <section className="uv-crud-card" aria-labelledby="addresses-title">
              <div className="uv-crud-card-header">
                <h2 id="addresses-title">Mis Direcciones de Entrega</h2>
                <span>{user.addresses.length} registradas</span>
              </div>

              <form className="uv-profile-form-stack" onSubmit={createAddress}>
                <div className="uv-crud-grid-2">
                  <label className="uv-crud-field">
                    <span>Etiqueta</span>
                    <input
                      required
                      maxLength={60}
                      placeholder="Casa, Campus Meléndez, Oficina"
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                    />
                  </label>
                  <label className="uv-crud-field">
                    <span>Dirección principal</span>
                    <input
                      required
                      maxLength={180}
                      placeholder="Calle 13 # 100-00"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </label>
                </div>

                <label className="uv-crud-field">
                  <span>Detalles / Punto de referencia (opcional)</span>
                  <input
                    maxLength={240}
                    placeholder="Edificio E20, oficina 204, portería peatonal..."
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                  />
                </label>

                <button
                  className="uv-crud-btn secondary full"
                  type="submit"
                  disabled={saving}
                >
                  + Agregar Dirección de Entrega
                </button>
              </form>

              <div className="uv-address-list">
                {user.addresses.length === 0 ? (
                  <p className="uv-crud-empty">
                    Aún no tienes direcciones registradas. Agrega una para poder
                    finalizar tus compras en el carrito.
                  </p>
                ) : (
                  user.addresses.map((item) => {
                    const selected = user.selectedAddressId === item.id
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
      </main>
    </div>
  )
}

export default ProfilePage
