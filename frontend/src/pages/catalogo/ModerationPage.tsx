import { useEffect, useState } from 'react'
import {
  listProfilesForManagement,
  setProfileStatus,
  type StoreProfile,
} from '../../services/usersApi'
import type { Product } from '../../types/product'
import '../../App.css'

interface ModerationPageProps {
  accessToken: string
  onBack: () => void
}

async function fetchModerationData(accessToken: string) {
  const [profiles, productResponse] = await Promise.all([
    listProfilesForManagement(accessToken),
    fetch('/api/products/manage', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ])
  if (!productResponse.ok) throw new Error('No se pudieron cargar los productos.')
  return {
    profiles,
    products: await productResponse.json() as Product[],
  }
}

function ModerationPage({ accessToken, onBack }: ModerationPageProps) {
  const [profiles, setProfiles] = useState<StoreProfile[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    let active = true
    void fetchModerationData(accessToken)
      .then((result) => {
        if (!active) return
        setProfiles(result.profiles)
        setProducts(result.products)
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.')
        }
      })
    return () => {
      active = false
    }
  }, [accessToken])

  async function reload() {
    const result = await fetchModerationData(accessToken)
    setProfiles(result.profiles)
    setProducts(result.products)
  }

  async function changeProductStatus(product: Product) {
    setBusyId(product.id)
    setError('')
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(product.id)}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: product.active === false }),
      })
      if (!response.ok) throw new Error('No se pudo cambiar el estado del producto.')
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado.')
    } finally {
      setBusyId('')
    }
  }

  async function changeProfileStatus(profile: StoreProfile) {
    setBusyId(profile.id)
    setError('')
    try {
      await setProfileStatus(accessToken, profile.id, !profile.active)
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="store-shell">
      <header className="profile-page-header">
        <button className="admin-secondary-button" type="button" onClick={onBack}>
          Volver al catálogo
        </button>
      </header>
      <main className="profile-page">
        <p className="eyebrow">Herramientas administrativas</p>
        <h1>Administrar tiendas y productos</h1>
        <p className="profile-intro">Puedes pausar o habilitar perfiles de tienda y productos publicados.</p>
        {error && <p className="profile-feedback error" role="alert">{error}</p>}

        <section className="moderation-section">
          <h2>Perfiles de tienda</h2>
          {profiles.map((profile) => (
            <article className="moderation-row" key={profile.id}>
              <span><strong>{profile.nickname}</strong><small>{profile.address || 'Sin dirección de tienda'}</small></span>
              <span className={`moderation-state ${profile.active ? 'active' : ''}`}>{profile.active ? 'Activo' : 'Inactivo'}</span>
              <button
                className={profile.active ? 'admin-danger-button' : 'admin-secondary-button'}
                type="button"
                disabled={busyId === profile.id}
                onClick={() => void changeProfileStatus(profile)}
              >
                {profile.active ? 'Desactivar' : 'Habilitar'}
              </button>
            </article>
          ))}
          {profiles.length === 0 && <p className="profile-intro">No hay perfiles registrados.</p>}
        </section>

        <section className="moderation-section">
          <h2>Productos</h2>
          {products.map((product) => (
            <article className="moderation-row" key={product.id}>
              <span><strong>{product.name}</strong><small>{product.shopName ?? product.profileId ?? 'Tienda'} · {product.category}</small></span>
              <span className={`moderation-state ${product.active !== false ? 'active' : ''}`}>{product.active !== false ? 'Activo' : 'Inactivo'}</span>
              <button
                className={product.active !== false ? 'admin-danger-button' : 'admin-secondary-button'}
                type="button"
                disabled={busyId === product.id}
                onClick={() => void changeProductStatus(product)}
              >
                {product.active !== false ? 'Desactivar' : 'Habilitar'}
              </button>
            </article>
          ))}
          {products.length === 0 && <p className="profile-intro">No hay productos para moderar.</p>}
        </section>
      </main>
    </div>
  )
}

export default ModerationPage
