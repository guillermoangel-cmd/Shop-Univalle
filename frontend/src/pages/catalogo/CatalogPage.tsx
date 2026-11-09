import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import type { Product } from '../../types/product'
import { DEFAULT_PROFILE_IMAGE, listStoreProfiles, type StoreProfile } from '../../services/usersApi'
import AdminCatalogPanel, { type CatalogCategory } from './AdminCatalogPanel'
import '../../App.css'

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface CatalogPageProps {
  bagCount: number
  onOpenCart: () => void
  onAddProduct: (product: Product) => Promise<void>
  accessToken?: string
  role?: string
  userId: string
  userName: string
  selectedStoreId: string | null
  onOpenProfile: () => void
  onOpenStore: (profileId: string) => void
  onOpenModeration: () => void
  onLogout: () => void
}

function CatalogPage({
  bagCount,
  onOpenCart,
  onAddProduct,
  accessToken = '',
  role = 'ESTUDIANTE',
  userId,
  userName,
  selectedStoreId,
  onOpenProfile,
  onOpenStore,
  onOpenModeration,
  onLogout,
}: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [profiles, setProfiles] = useState<StoreProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [addingId, setAddingId] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase('es'))

  useEffect(() => {
    const controller = new AbortController()

    async function loadCatalog() {
      try {
        const query = selectedStoreId
          ? `?profileId=${encodeURIComponent(selectedStoreId)}`
          : ''
        const [productResponse, categoryResponse, profileData] = await Promise.all([
          fetch(`/api/products${query}`, { signal: controller.signal }),
          fetch(`/api/categories${query}`, { signal: controller.signal }),
          listStoreProfiles(),
        ])

        if (!productResponse.ok) throw new Error('No se pudieron cargar los productos.')
        if (!categoryResponse.ok) throw new Error('No se pudieron cargar las categorías.')
        const productData: unknown = await productResponse.json()
        const categoryData: unknown = await categoryResponse.json()

        const activeProfileIds = new Set(profileData.map((profile) => profile.id))
        const validProducts = Array.isArray(productData)
          ? (productData as Product[]).filter(
              (product) => product.profileId && activeProfileIds.has(product.profileId),
            ).map((product) => ({
              ...product,
              shopName: profileData.find((profile) => profile.id === product.profileId)?.nickname,
            }))
          : []

        const validCategories = Array.isArray(categoryData)
          ? (categoryData as CatalogCategory[])
          : []

        startTransition(() => {
          setProducts(validProducts)
          setCategories(validCategories)
          setProfiles(profileData)
        })
        setError('')
      } catch (cause: unknown) {
        if (!controller.signal.aborted) {
          startTransition(() => {
            setProducts([])
            setCategories([])
          })
          const message =
            cause instanceof Error ? cause.message : 'Error al cargar el catálogo.'
          setError(message)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadCatalog()

    return () => controller.abort()
  }, [refreshKey, selectedStoreId])

  const selectedStore = profiles.find((profile) => profile.id === selectedStoreId)
  const storesWithCounts = profiles.map((profile) => ({
    ...profile,
    productCount: products.filter((product) => product.profileId === profile.id).length,
  }))

  const categoryNames = [
    ...new Set([
      ...categories.map((item) => item.name),
      ...products.map((product) => product.category),
    ]),
  ]
  const refreshCatalog = () => setRefreshKey((key) => key + 1)
  const visibleProducts = products.filter((product) => {
    const matchesCategory =
      category === 'Todas' || product.category === category
    const searchableText = `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase(
      'es',
    )
    return matchesCategory && searchableText.includes(deferredSearch)
  })

  const handleAddClick = async (product: Product) => {
    if (!selectedStoreId && product.profileId) {
      onOpenStore(product.profileId)
      return
    }
    setAddingId(product.id)
    try {
      const store = profiles.find((profile) => profile.id === product.profileId)
      await onAddProduct({
        ...product,
        shopName: store?.nickname,
        shippingCost: store?.shippingCost ?? 8000,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo agregar el producto.')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="store-shell">
      <div className="utility-bar">
        <span>Univalle Shop · Sede Norte del Cauca, Colombia</span>
        <span>Un espacio para la comunidad universitaria</span>
      </div>

      <header className="main-header">
        <a
          className="wordmark"
          href="/"
          onClick={(e) => {
            e.preventDefault()
          }}
          aria-label="Univalle Shop, inicio"
        >
          <span className="wordmark-seal">UV</span>
          <span className="wordmark-name">
            Univalle Shop
            <small>Mercado universitario</small>
          </span>
        </a>

        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar en el catálogo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar productos"
          />
        </label>

        <div className="header-actions">
          <span className="welcome-message">
            ¡Te damos la bienvenida! <strong>{userName}</strong>
          </span>
          <button
            className="profile-button"
            type="button"
            onClick={onOpenProfile}
            aria-label="Abrir mi perfil y direcciones"
            title="Mi perfil"
          >
            <svg
              aria-hidden="true"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
            </svg>
            Perfil
          </button>
          <button
            className="bag-button"
            type="button"
            onClick={onOpenCart}
            title="Ver mi carrito de compras"
          >
            Mi bolsa <span aria-label={`${bagCount} productos`}>{bagCount}</span>
          </button>
          {role === 'ADMINISTRATIVO' && (
            <button className="role-badge role-badge-button" type="button" onClick={onOpenModeration}>
              Administrar
            </button>
          )}
          <button className="logout-button" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main>
        {error && <p className="catalog-message error" role="alert">{error}</p>}

        <section className="catalog-intro">
          <div>
            <p className="eyebrow">Hecho en comunidad</p>
            <h1>{selectedStore ? selectedStore.nickname : 'El catálogo Univalle'}</h1>
          </div>
          {selectedStore && (
            <img className="catalog-store-image" src={selectedStore.imageUrl || DEFAULT_PROFILE_IMAGE} alt={`Imagen de ${selectedStore.nickname}`} />
          )}
          <p className="intro-note">
            {selectedStore
              ? `Tienda de la comunidad universitaria · Envío ${currency.format(selectedStore.shippingCost)}`
              : 'Productos, proyectos y creaciones de estudiantes, docentes y equipos de la Universidad.'}
          </p>
        </section>

        {selectedStoreId === userId && (
          <AdminCatalogPanel
            accessToken={accessToken}
            categories={categories}
            onChanged={refreshCatalog}
          />
        )}

        <section className="catalog-toolbar" aria-label="Filtros del catálogo">
          <span className="results-count">
            {loading
              ? 'Cargando catálogo…'
              : `${visibleProducts.length} productos — ${selectedStore?.nickname ?? userName}`}
          </span>
          {!selectedStoreId && (
            <button className="store-link-button" type="button" onClick={() => onOpenStore(userId)}>
              Ir a mi tienda
            </button>
          )}
          {selectedStoreId && (
            <button className="store-link-button" type="button" onClick={() => onOpenStore('')}>
              Ver todas las tiendas
            </button>
          )}
          <label className="category-filter">
            <span>Categoría</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Todas</option>
              {categoryNames.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </section>

        {!selectedStoreId && (
          <section className="shop-grid" aria-label="Tiendas de la comunidad">
            {storesWithCounts.map((profile) => (
              <article className="shop-card" key={profile.id}>
                <img src={profile.imageUrl || DEFAULT_PROFILE_IMAGE} alt={`Imagen de ${profile.nickname}`} />
                <span className="eyebrow">Tienda Univalle</span>
                <h2>{profile.nickname}</h2>
                <p>{profile.productCount} productos</p>
                <button className="admin-secondary-button" type="button" onClick={() => onOpenStore(profile.id)}>
                  Ir a tienda
                </button>
              </article>
            ))}
            {storesWithCounts.length === 0 && !loading && (
              <p className="catalog-message">Todavía no hay tiendas activas.</p>
            )}
          </section>
        )}

        <section
          className="product-grid"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading && <p className="catalog-message">Cargando productos…</p>}
          {!loading && visibleProducts.length === 0 && (
            <div className="catalog-message">
              <strong>
                {products.length ? 'Sin coincidencias' : 'Pronto habrá productos aquí'}
              </strong>
              <span>
                {products.length
                  ? 'Prueba otra búsqueda o categoría.'
                  : 'El catálogo todavía no tiene productos publicados.'}
              </span>
            </div>
          )}
          {!loading &&
            visibleProducts.map((product, index) => (
              <article
                className="product-card"
                key={product.id}
                style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
              >
                <div className="product-media">
                  <img
                    src={product.imageUrl || '/assets/default_products/producto_default.webp'}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      const fallback = '/assets/default_products/producto_default.webp'
                      if (event.currentTarget.src !== new URL(fallback, window.location.href).href) {
                        event.currentTarget.src = fallback
                      }
                    }}
                  />
                </div>
                <p className="product-category">
                  {product.category} — {product.shopName ?? 'Tienda'}
                </p>
                <h2>{product.name}</h2>
                <p className="product-description">
                  {product.description || 'Una creación de la comunidad universitaria.'}
                </p>
                <div className="product-buy-row">
                  <span className="product-price">
                    {currency.format(product.price)}
                  </span>
                  <button
                    className="add-button"
                    type="button"
                    disabled={Boolean(selectedStoreId && product.stock < 1) || addingId === product.id}
                    onClick={() => void handleAddClick(product)}
                  >
                    {!selectedStoreId
                      ? 'Ir a tienda'
                      : addingId === product.id
                      ? 'Añadiendo…'
                      : product.stock > 0
                        ? 'Añadir'
                        : 'Agotado'}
                  </button>
                </div>
              </article>
            ))}
        </section>
      </main>

      <footer className="site-footer">
        <span>Univalle Shop · Proyecto académico</span>
        <span>Conectado con Orders Service · Arquitectura Hexagonal</span>
      </footer>
    </div>
  )
}

export default CatalogPage
