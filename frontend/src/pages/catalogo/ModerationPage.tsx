import { useEffect, useState } from 'react'
import {
  listProfilesForManagement,
  setProfileStatus,
  type StoreProfile,
} from '../../api/usersApi'
import type { Product } from '../../types/product'
import type { CatalogCategory } from './AdminCatalogPanel'
import './CatalogPage.css'

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface ModerationPageProps {
  accessToken: string
  userName?: string
  bagCount?: number
  onBack: () => void
  onOpenProfile?: () => void
  onOpenManage?: () => void
  onOpenCart?: () => void
  onLogout?: () => void
}

type ModerationTab = 'all' | 'profiles' | 'products' | 'categories'

async function moderationRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(path, { ...init, headers })
  const result = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | T
    | null
  if (!response.ok) {
    const message =
      result && typeof result === 'object' && 'message' in result
        ? result.message
        : undefined
    throw new Error(
      Array.isArray(message)
        ? message.join(' ')
        : message || 'No se pudo completar la moderación.',
    )
  }
  return result as T
}

function ModerationPage({
  accessToken,
  userName = 'Administrador',
  bagCount = 0,
  onBack,
  onOpenProfile,
  onOpenManage,
  onOpenCart,
  onLogout,
}: ModerationPageProps) {
  const [profiles, setProfiles] = useState<StoreProfile[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ModerationTab>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      listProfilesForManagement(accessToken),
      moderationRequest<Product[]>('/api/products/moderation', accessToken),
      moderationRequest<CatalogCategory[]>(
        '/api/categories/moderation',
        accessToken,
      ),
    ])
      .then(([profileData, productData, categoryData]) => {
        if (!active) return
        setProfiles(profileData)
        setProducts(Array.isArray(productData) ? productData : [])
        setCategories(Array.isArray(categoryData) ? categoryData : [])
        setError('')
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo cargar el panel de moderación.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [accessToken])

  async function refreshAll() {
    const [profileData, productData, categoryData] = await Promise.all([
      listProfilesForManagement(accessToken),
      moderationRequest<Product[]>('/api/products/moderation', accessToken),
      moderationRequest<CatalogCategory[]>(
        '/api/categories/moderation',
        accessToken,
      ),
    ])
    setProfiles(profileData)
    setProducts(Array.isArray(productData) ? productData : [])
    setCategories(Array.isArray(categoryData) ? categoryData : [])
  }

  async function toggleProfile(profile: StoreProfile) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await setProfileStatus(accessToken, profile.id, !profile.active)
      await refreshAll()
      setMessage(
        `Perfil de tienda "${profile.nickname}" ${profile.active ? 'desactivado' : 'reactivado'}.`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo actualizar el perfil.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleProduct(product: Product) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (product.active === false) {
        await moderationRequest(
          `/api/products/${encodeURIComponent(product.id)}/restore`,
          accessToken,
          { method: 'PATCH' },
        )
      } else {
        await moderationRequest(
          `/api/products/${encodeURIComponent(product.id)}`,
          accessToken,
          { method: 'DELETE' },
        )
      }
      await refreshAll()
      setMessage(
        `Producto "${product.name}" ${product.active === false ? 'reactivado' : 'desactivado'}.`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo actualizar el producto.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleCategory(category: CatalogCategory) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (category.active === false) {
        await moderationRequest(
          `/api/categories/${encodeURIComponent(category.id)}/restore`,
          accessToken,
          { method: 'PATCH' },
        )
      } else {
        await moderationRequest(
          `/api/categories/${encodeURIComponent(category.id)}`,
          accessToken,
          { method: 'DELETE' },
        )
      }
      await refreshAll()
      setMessage(
        `Categoría "${category.name}" ${category.active === false ? 'reactivada' : 'desactivada'}.`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo actualizar la categoría.',
      )
    } finally {
      setSaving(false)
    }
  }

  const normalizedQuery = searchTerm.trim().toLowerCase()

  const filteredProfiles = profiles.filter(
    (p) =>
      !normalizedQuery ||
      p.nickname.toLowerCase().includes(normalizedQuery) ||
      p.id.toLowerCase().includes(normalizedQuery),
  )

  const filteredProducts = products.filter(
    (p) =>
      !normalizedQuery ||
      p.name.toLowerCase().includes(normalizedQuery) ||
      p.category.toLowerCase().includes(normalizedQuery),
  )

  const filteredCategories = categories.filter(
    (c) =>
      !normalizedQuery ||
      c.name.toLowerCase().includes(normalizedQuery) ||
      c.description.toLowerCase().includes(normalizedQuery),
  )

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
          {onOpenManage && (
            <button
              type="button"
              className="uv-header-tab"
              onClick={onOpenManage}
            >
              GESTIÓN CRUD
            </button>
          )}
          <button type="button" className="uv-header-tab active">
            MODERACIÓN
          </button>
        </div>

        <div className="uv-header-right">
          <span className="uv-role-pill admin">
            Administrador · {userName}
          </span>

          {onOpenProfile && (
            <button
              type="button"
              className="uv-header-icon-btn"
              onClick={onOpenProfile}
              aria-label="Mi perfil"
              title="Mi perfil y direcciones"
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
          )}

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

          {onLogout && (
            <button
              type="button"
              className="uv-header-link"
              onClick={onLogout}
            >
              CERRAR SESIÓN
            </button>
          )}
        </div>
      </header>

      <main className="uv-catalog-main">
        {/* Hero Banner */}
        <div className="uv-subpage-hero">
          <div>
            <p className="uv-subpage-eyebrow">
              SUPERVISIÓN INSTITUCIONAL · ADMINISTRACIÓN GENERAL
            </p>
            <h1 className="uv-subpage-title">
              Panel de Moderación de Tienda Univalle
            </h1>
            <p className="uv-subpage-desc">
              Supervisa, activa o desactiva perfiles de tienda, productos y
              categorías registradas por integrantes de la comunidad universitaria.
            </p>
          </div>
          <div className="uv-admin-toolbar-actions">
            {onOpenManage && (
              <button
                type="button"
                className="uv-admin-btn primary"
                onClick={onOpenManage}
              >
                + Ir a Gestión CRUD
              </button>
            )}
            <button type="button" className="uv-admin-btn" onClick={onBack}>
              ← Volver al Catálogo
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="uv-mod-stats-grid">
          <div className="uv-mod-stat-card">
            <span className="uv-mod-stat-label">PERFILES DE TIENDA</span>
            <strong className="uv-mod-stat-value">{profiles.length}</strong>
            <span className="uv-mod-stat-sub">
              {profiles.filter((p) => p.active).length} activos
            </span>
          </div>
          <div className="uv-mod-stat-card">
            <span className="uv-mod-stat-label">PRODUCTOS REGISTRADOS</span>
            <strong className="uv-mod-stat-value">{products.length}</strong>
            <span className="uv-mod-stat-sub">
              {products.filter((p) => p.active !== false).length} publicados
            </span>
          </div>
          <div className="uv-mod-stat-card">
            <span className="uv-mod-stat-label">CATEGORÍAS CREADAS</span>
            <strong className="uv-mod-stat-value">{categories.length}</strong>
            <span className="uv-mod-stat-sub">
              {categories.filter((c) => c.active !== false).length} activas
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="uv-mod-controls-bar">
          <div className="uv-mod-tabs">
            <button
              type="button"
              className={`uv-mod-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Vista General
            </button>
            <button
              type="button"
              className={`uv-mod-tab ${activeTab === 'profiles' ? 'active' : ''}`}
              onClick={() => setActiveTab('profiles')}
            >
              Tiendas ({profiles.length})
            </button>
            <button
              type="button"
              className={`uv-mod-tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Productos ({products.length})
            </button>
            <button
              type="button"
              className={`uv-mod-tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Categorías ({categories.length})
            </button>
          </div>

          <input
            type="search"
            className="uv-mod-search"
            placeholder="Filtrar por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Filtrar elementos en moderación"
          />
        </div>

        {loading && (
          <div className="uv-empty-catalog">
            <strong>Cargando datos de moderación...</strong>
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

        {/* Store Profiles Section */}
        {(activeTab === 'all' || activeTab === 'profiles') && (
          <section className="uv-crud-section">
            <div className="uv-crud-section-header">
              <h2>Perfiles de Tienda ({filteredProfiles.length})</h2>
              <span>Control de tiendas habilitadas en la plataforma</span>
            </div>

            {filteredProfiles.length === 0 ? (
              <p className="uv-crud-empty">
                No se encontraron perfiles de tienda.
              </p>
            ) : (
              <div className="uv-crud-list">
                {filteredProfiles.map((profile) => (
                  <article className="uv-mod-row" key={profile.id}>
                    <div className="uv-mod-row-info">
                      <strong>{profile.nickname}</strong>
                      <span>
                        Tarifa de envío:{' '}
                        {copFormatter
                          .format(profile.shippingCost)
                          .replace(/\s+/g, '')}{' '}
                        · ID: {profile.id}
                      </span>
                    </div>
                    <div className="uv-crud-row-actions">
                      <span
                        className={`uv-status-badge ${profile.active ? 'active' : 'inactive'}`}
                      >
                        {profile.active ? 'Activa' : 'Inactiva'}
                      </span>
                      <button
                        className={`uv-crud-btn ${profile.active ? 'danger' : 'secondary'}`}
                        type="button"
                        disabled={saving}
                        onClick={() => void toggleProfile(profile)}
                      >
                        {profile.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Products Section */}
        {(activeTab === 'all' || activeTab === 'products') && (
          <section className="uv-crud-section">
            <div className="uv-crud-section-header">
              <h2>Productos ({filteredProducts.length})</h2>
              <span>Publicaciones de todas las tiendas</span>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="uv-crud-empty">
                No hay productos registrados para mostrar.
              </p>
            ) : (
              <div className="uv-crud-list">
                {filteredProducts.map((product) => {
                  const isActive = product.active !== false
                  return (
                    <article className="uv-mod-row" key={product.id}>
                      <div className="uv-mod-row-info">
                        <strong>{product.name}</strong>
                        <span>
                          Categoría: {product.category} · Precio:{' '}
                          {copFormatter
                            .format(product.price)
                            .replace(/\s+/g, '')}{' '}
                          · Stock: {product.stock}
                        </span>
                      </div>
                      <div className="uv-crud-row-actions">
                        <span
                          className={`uv-status-badge ${isActive ? 'active' : 'inactive'}`}
                        >
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          className={`uv-crud-btn ${isActive ? 'danger' : 'secondary'}`}
                          type="button"
                          disabled={saving}
                          onClick={() => void toggleProduct(product)}
                        >
                          {isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Categories Section */}
        {(activeTab === 'all' || activeTab === 'categories') && (
          <section className="uv-crud-section">
            <div className="uv-crud-section-header">
              <h2>Categorías ({filteredCategories.length})</h2>
              <span>Clasificaciones creadas en el catálogo</span>
            </div>

            {filteredCategories.length === 0 ? (
              <p className="uv-crud-empty">
                No hay categorías registradas para mostrar.
              </p>
            ) : (
              <div className="uv-crud-list">
                {filteredCategories.map((category) => {
                  const isActive = category.active !== false
                  return (
                    <article className="uv-mod-row" key={category.id}>
                      <div className="uv-mod-row-info">
                        <strong>{category.name}</strong>
                        <span>
                          {category.description || 'Sin descripción adicional'}
                        </span>
                      </div>
                      <div className="uv-crud-row-actions">
                        <span
                          className={`uv-status-badge ${isActive ? 'active' : 'inactive'}`}
                        >
                          {isActive ? 'Activa' : 'Inactiva'}
                        </span>
                        <button
                          className={`uv-crud-btn ${isActive ? 'danger' : 'secondary'}`}
                          type="button"
                          disabled={saving}
                          onClick={() => void toggleCategory(category)}
                        >
                          {isActive ? 'Desactivar' : 'Activar'}
                        </button>
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

export default ModerationPage
