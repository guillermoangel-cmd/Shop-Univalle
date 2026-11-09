import { useEffect, useState, type FormEvent } from 'react'
import {
  addCustomerAddress,
  deleteCustomerAddress,
  getCurrentUser,
  getMyProfile,
  selectCustomerAddress,
  updateMyProfile,
  type CustomerAddress,
  type StoreProfile,
} from '../../services/usersApi'
import '../../App.css'

interface ProfilePageProps {
  accessToken: string
  onBack: () => void
  onLogout: () => void
}

function ProfilePage({ accessToken, onBack, onLogout }: ProfilePageProps) {
  const [profile, setProfile] = useState<StoreProfile | null>(null)
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [nickname, setNickname] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shippingCost, setShippingCost] = useState('0')
  const [addressLabel, setAddressLabel] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [addressDetails, setAddressDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getMyProfile(accessToken), getCurrentUser(accessToken)])
      .then(([shop, user]) => {
        if (!active) return
        setProfile(shop)
        setNickname(shop.nickname)
        setShopAddress(shop.address)
        setShippingCost(String(shop.shippingCost))
        setAddresses(user.addresses)
        setSelectedAddressId(user.selectedAddressId)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el perfil.')
      })
    return () => {
      active = false
    }
  }, [accessToken])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const saved = await updateMyProfile(accessToken, {
        nickname: nickname.trim(),
        address: shopAddress.trim(),
        shippingCost: Number(shippingCost),
      })
      setProfile(saved)
      setMessage('Los datos de tu tienda se guardaron.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el perfil.')
    } finally {
      setBusy(false)
    }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await addCustomerAddress(accessToken, {
        label: addressLabel.trim(),
        address: customerAddress.trim(),
        details: addressDetails.trim(),
      })
      setAddresses(result.addresses)
      setSelectedAddressId(result.selectedAddressId)
      setAddressLabel('')
      setCustomerAddress('')
      setAddressDetails('')
      setMessage('Dirección de entrega guardada y seleccionada.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la dirección.')
    } finally {
      setBusy(false)
    }
  }

  async function chooseAddress(id: string) {
    setBusy(true)
    setError('')
    try {
      const result = await selectCustomerAddress(accessToken, id)
      setAddresses(result.addresses)
      setSelectedAddressId(result.selectedAddressId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo seleccionar la dirección.')
    } finally {
      setBusy(false)
    }
  }

  async function removeAddress(id: string) {
    setBusy(true)
    setError('')
    try {
      const result = await deleteCustomerAddress(accessToken, id)
      setAddresses(result.addresses)
      setSelectedAddressId(result.selectedAddressId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la dirección.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="store-shell">
      <header className="profile-page-header">
        <button className="admin-secondary-button" type="button" onClick={onBack}>
          Volver al catálogo
        </button>
        <button className="logout-button" type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </header>
      <main className="profile-page">
        <p className="eyebrow">Mi cuenta</p>
        <h1>Tu perfil y direcciones</h1>
        <p className="profile-intro">
          Configura tu tienda y guarda las direcciones donde quieres recibir tus compras.
        </p>

        <form className="profile-form" onSubmit={(event) => void saveProfile(event)}>
          <h2>Mi tienda</h2>
          <label>
            <span>Apodo de la tienda</span>
            <input required maxLength={60} value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>
          <label>
            <span>Dirección de la tienda</span>
            <input maxLength={240} value={shopAddress} onChange={(event) => setShopAddress(event.target.value)} />
          </label>
          <label>
            <span>Costo de envío a domicilio (COP)</span>
            <input required type="number" min="0" step="1" value={shippingCost} onChange={(event) => setShippingCost(event.target.value)} />
          </label>
          <button className="admin-primary-button" disabled={busy || !profile} type="submit">
            {busy ? 'Guardando…' : 'Guardar tienda'}
          </button>
        </form>

        <section className="profile-addresses" aria-labelledby="customer-addresses-title">
          <h2 id="customer-addresses-title">Mis direcciones de entrega</h2>
          <p>La dirección seleccionada se usará al pagar cada carrito.</p>
          {addresses.map((address) => (
            <article className="profile-address-row" key={address.id}>
              <label>
                <input
                  type="radio"
                  name="selectedAddress"
                  checked={selectedAddressId === address.id}
                  onChange={() => void chooseAddress(address.id)}
                  disabled={busy}
                />
                <span>
                  <strong>{address.label}</strong>
                  <span>{address.address}{address.details ? ` · ${address.details}` : ''}</span>
                </span>
              </label>
              <button className="admin-danger-button" type="button" disabled={busy} onClick={() => void removeAddress(address.id)}>
                Eliminar
              </button>
            </article>
          ))}
          {addresses.length === 0 && <p className="profile-intro">Aún no has guardado direcciones.</p>}

          <form className="profile-form profile-address-form" onSubmit={(event) => void saveAddress(event)}>
            <h3>Agregar dirección</h3>
            <label>
              <span>Nombre corto</span>
              <input required maxLength={40} placeholder="Casa, trabajo…" value={addressLabel} onChange={(event) => setAddressLabel(event.target.value)} />
            </label>
            <label>
              <span>Dirección</span>
              <input required maxLength={240} value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} />
            </label>
            <label>
              <span>Indicaciones adicionales</span>
              <input maxLength={240} value={addressDetails} onChange={(event) => setAddressDetails(event.target.value)} />
            </label>
            <button className="admin-secondary-button" disabled={busy} type="submit">Guardar dirección</button>
          </form>
        </section>
        {error && <p className="profile-feedback error" role="alert">{error}</p>}
        {message && <p className="profile-feedback" role="status">{message}</p>}
      </main>
    </div>
  )
}

export default ProfilePage
