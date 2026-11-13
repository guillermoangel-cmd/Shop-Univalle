import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import UnivalleFooter from '../../components/footer/UnivalleFooter'
import { listStoreProfiles, type StoreProfile } from '../../api/usersApi'
import type { Product } from '../../types/product'
import type { CatalogCategory } from './AdminCatalogPanel'
import './CatalogPage.css'

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatPrice(value: number): string {
  return copFormatter.format(value).replace(/\s+/g, '')
}

const BASE_CATEGORIES = [
  'Todos',
  'Ropa',
  'Accesorios',
  'Libros',
  'Papelería',
  'Tecnología',
  'Otros',
]

type PriceFilter = 'all' | 'under20k' | '20kTo50k' | '50kTo100k' | 'over100k'
type SortOption = 'relevant' | 'priceAsc' | 'priceDesc' | 'nameAsc'

const PRICE_RANGES: { id: PriceFilter; label: string }[] = [
  { id: 'all', label: 'Todos los precios' },
  { id: 'under20k', label: 'Menos de $20.000' },
  { id: '20kTo50k', label: '$20.000 - $50.000' },
  { id: '50kTo100k', label: '$50.000 - $100.000' },
  { id: 'over100k', label: 'Más de $100.000' },
]

const ITEMS_PER_PAGE = 8

interface CatalogPageProps {
  bagCount: number
  onOpenCart: () => void
  onAddProduct: (product: Product) => Promise<void>
  role?: string
  userId: string
  userName: string
  selectedStoreId: string | null
  onOpenProfile: () => void
  onOpenManage: () => void
  onOpenStore: (profileId: string) => void
  onOpenModeration: () => void
  onLogout: () => void
}

function matchesPriceRange(price: number, range: PriceFilter): boolean {
  switch (range) {
    case 'under20k':
      return price < 20000
    case '20kTo50k':
      return price >= 20000 && price <= 50000
    case '50kTo100k':
      return price > 50000 && price <= 100000
    case 'over100k':
      return price > 100000
    default:
      return true
  }
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

function CatalogPage({
  bagCount,
  onOpenCart,
  onAddProduct,
  role = 'ESTUDIANTE',
  userId,
  userName,
  selectedStoreId,
  onOpenProfile,
  onOpenManage,
  onOpenStore,
  onOpenModeration,
  onLogout,
}: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [profiles, setProfiles] = useState<StoreProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('relevant')
  const [currentPage, setCurrentPage] = useState(1)
  const [addingId, setAddingId] = useState<string | null>(null)

  const isAdmin = role === 'ADMINISTRATIVO' || role === 'ADMINISTRADOR'

  const deferredSearch = useDeferredValue(normalizeText(search))

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    async function loadCatalog() {
      try {
        const query = selectedStoreId
          ? `?profileId=${encodeURIComponent(selectedStoreId)}`
          : ''
        const [productResponse, categoryResponse, profileData] = await Promise.all([
          fetch(`/api/products${query}`, { signal: controller.signal }).catch(() => null),
          fetch(`/api/categories${query}`, { signal: controller.signal }).catch(() => null),
          listStoreProfiles().catch(() => [] as StoreProfile[]),
        ])

        let fetchedProducts: Product[] = []
        if (productResponse && productResponse.ok) {
          const rawProducts: unknown = await productResponse.json()
          if (Array.isArray(rawProducts)) {
            fetchedProducts = (rawProducts as Product[]).map((product) => ({
              ...product,
              shopName: profileData.find((p) => p.id === product.profileId)?.nickname,
            }))
          }
        }

        let fetchedCategories: CatalogCategory[] = []
        if (categoryResponse && categoryResponse.ok) {
          const rawCategories: unknown = await categoryResponse.json()
          if (Array.isArray(rawCategories)) {
            fetchedCategories = rawCategories as CatalogCategory[]
          }
        }

        startTransition(() => {
          setProducts(fetchedProducts)
          setCategories(fetchedCategories)
          setProfiles(profileData)
        })
        setError('')
      } catch (cause: unknown) {
        if (!controller.signal.aborted) {
          startTransition(() => {
            setProducts([])
          })
          setError(cause instanceof Error ? cause.message : '')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadCatalog()
    return () => controller.abort()
  }, [selectedStoreId])

  const dynamicCategoryNames = categories
    .map((item) => item.name)
    .filter(
      (name) =>
        !BASE_CATEGORIES.some((base) => normalizeText(base) === normalizeText(name)),
    )

  const sidebarCategories = [...BASE_CATEGORIES, ...dynamicCategoryNames]

  const filteredProducts = products
    .filter((product) => {
      const matchesCat =
        selectedCategory === 'Todos' ||
        normalizeText(product.category) === normalizeText(selectedCategory)
      const matchesPrice = matchesPriceRange(product.price, priceFilter)
      const searchable = normalizeText(
        `${product.name} ${product.description} ${product.category}`,
      )
      const matchesQuery = !deferredSearch || searchable.includes(deferredSearch)
      return matchesCat && matchesPrice && matchesQuery
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return a.price - b.price
      if (sortBy === 'priceDesc') return b.price - a.price
      if (sortBy === 'nameAsc') return a.name.localeCompare(b.name, 'es')
      return 0
    })

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  )

  const handleFilterCategory = (cat: string) => {
    setSelectedCategory(cat)
    setCurrentPage(1)
  }

  const handleFilterPrice = (range: PriceFilter) => {
    setPriceFilter(range)
    setCurrentPage(1)
  }

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, nextPage))
    setCurrentPage(clamped)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 140, behavior: 'smooth' })
    }
  }

  const handleAddClick = async (product: Product) => {
    setAddingId(product.id)
    try {
      const store = profiles.find((profile) => profile.id === product.profileId)
      await onAddProduct({
        ...product,
        profileId: product.profileId || selectedStoreId || 'default-store',
        shopName: store?.nickname,
        shippingCost: store?.shippingCost ?? 8000,
      })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No se pudo agregar el producto.',
      )
    } finally {
      setAddingId(null)
    }
  }

  const roleLabel = isAdmin
    ? 'Administrador'
    : role === 'DOCENTE'
      ? 'Docente'
      : 'Estudiante'

  return (
    <div className="uv-catalog-page">
      {/* Top Header with Official Univalle Logo & Person Icon */}
      <header className="uv-catalog-header">
        <button
          type="button"
          className="uv-header-brand"
          onClick={() => {
            onOpenStore('')
            setSelectedCategory('Todos')
            setPriceFilter('all')
            setSearch('')
            setCurrentPage(1)
          }}
        >
          <img
            src="/assets/univalle-logo.png"
            alt="Logo Universidad del Valle"
            className="uv-header-logo-img"
          />
          <span className="uv-header-title">TIENDA UNIVALLE</span>
        </button>

        <div className="uv-header-center">
          <button
            type="button"
            className="uv-header-tab active"
            onClick={() => onOpenStore('')}
          >
            CATÁLOGO
          </button>
        </div>

        <div className="uv-header-right">
          <span className={`uv-role-pill ${isAdmin ? 'admin' : ''}`}>
            {roleLabel} · {userName}
          </span>

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

          <button
            type="button"
            className="uv-header-link"
            onClick={onLogout}
          >
            CERRAR SESIÓN
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="uv-catalog-main">
        {/* Role-Aware Toolbar: Opens Dedicated CRUD View */}
        <div className="uv-admin-toolbar">
          <div className="uv-admin-toolbar-info">
            {isAdmin ? (
              <span>
                <strong>Modo Administrador:</strong> Gestiona productos y
                categorías en su interfaz dedicada o supervisa todas las tiendas en el
                panel de moderación.
              </span>
            ) : (
              <span>
                <strong>Comunidad Univalle ({roleLabel}):</strong> Explora el
                catálogo institucional o administra las publicaciones de tu tienda.
              </span>
            )}
          </div>

          <div className="uv-admin-toolbar-actions">
            <button
              type="button"
              className={`uv-admin-btn ${!selectedStoreId ? 'active' : ''}`}
              aria-pressed={!selectedStoreId}
              onClick={() => onOpenStore('')}
            >
              Ver Todo el Catálogo
            </button>

            <button
              type="button"
              className={`uv-admin-btn ${selectedStoreId === userId ? 'active' : ''}`}
              aria-pressed={selectedStoreId === userId}
              onClick={() => onOpenStore(userId)}
            >
              Ver Solo Mi Tienda
            </button>

            <button
              type="button"
              className="uv-admin-btn"
              onClick={onOpenManage}
            >
              {isAdmin
                ? '+ Gestionar Productos y Categorías (CRUD)'
                : 'Gestionar Mi Tienda (CRUD)'}
            </button>

            {isAdmin && (
              <button
                type="button"
                className="uv-admin-btn"
                onClick={onOpenModeration}
              >
                Panel de Moderación
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="catalog-message error" role="alert">
            {error}
          </p>
        )}

        {/* Top Centered Search Bar */}
        <div className="uv-search-container">
          <label className="uv-search-input-wrap">
            <span className="uv-search-icon" aria-hidden="true">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              className="uv-search-input"
              placeholder="Buscar productos..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              aria-label="Buscar productos"
            />
          </label>
        </div>

        {/* Two-Column Catalog Layout */}
        <div className="uv-catalog-layout">
          {/* Left Filter Sidebar */}
          <aside className="uv-filter-sidebar" aria-label="Filtros de catálogo">
            <h2 className="uv-filter-heading">FILTRAR POR</h2>

            <div className="uv-filter-group">
              <h3 className="uv-filter-group-title">CATEGORÍA</h3>
              {sidebarCategories.map((cat) => {
                const isSelected =
                  normalizeText(selectedCategory) === normalizeText(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`uv-radio-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleFilterCategory(cat)}
                  >
                    <span className="uv-radio-circle">
                      {isSelected && <span className="uv-radio-dot" />}
                    </span>
                    <span>{cat}</span>
                  </button>
                )
              })}
            </div>

            <div className="uv-filter-group">
              <h3 className="uv-filter-group-title">PRECIO</h3>
              {PRICE_RANGES.map((range) => {
                const isSelected = priceFilter === range.id
                return (
                  <button
                    key={range.id}
                    type="button"
                    className={`uv-radio-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleFilterPrice(range.id)}
                  >
                    <span className="uv-radio-circle">
                      {isSelected && <span className="uv-radio-dot" />}
                    </span>
                    <span>{range.label}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Right Products Column */}
          <section className="uv-products-section" aria-live="polite" aria-busy={loading}>
            <div className="uv-products-topbar">
              <p className="uv-products-count">
                Mostrando <strong>{filteredProducts.length}</strong> productos
              </p>

              <select
                className="uv-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Ordenar productos"
              >
                <option value="relevant">Más relevante</option>
                <option value="priceAsc">Precio: menor a mayor</option>
                <option value="priceDesc">Precio: mayor a menor</option>
                <option value="nameAsc">Nombre: A - Z</option>
              </select>
            </div>

            <div className="uv-products-grid">
              {loading ? (
                <div className="uv-empty-catalog">
                  <strong>Cargando catálogo...</strong>
                  <p>Consultando los productos publicados en la tienda.</p>
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div className="uv-empty-catalog">
                  <strong>
                    {products.length === 0
                      ? 'Aún no hay productos publicados en el catálogo'
                      : 'No encontramos productos con esos filtros'}
                  </strong>
                  <p>
                    {products.length === 0
                      ? 'Usa el botón de Gestión CRUD para crear categorías y publicar tus primeros productos.'
                      : 'Prueba seleccionando otra categoría o rango de precios.'}
                  </p>
                </div>
              ) : (
                paginatedProducts.map((product) => {
                  const hasCustomImage =
                    Boolean(product.imageUrl) &&
                    !product.imageUrl.includes('producto_default.webp')

                  return (
                    <article className="uv-product-card" key={product.id}>
                      <div className="uv-product-thumb">
                        {hasCustomImage ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                          />
                        ) : (
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                        )}
                      </div>

                      <p className="uv-product-cat">{product.category}</p>
                      <h3 className="uv-product-title" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="uv-product-price">
                        {formatPrice(product.price)}
                      </p>

                      <button
                        type="button"
                        className="uv-add-cart-btn"
                        disabled={product.stock < 1 || addingId === product.id}
                        onClick={() => void handleAddClick(product)}
                      >
                        {addingId === product.id
                          ? 'AGREGANDO...'
                          : product.stock > 0
                            ? 'AGREGAR AL CARRITO'
                            : 'AGOTADO'}
                      </button>
                    </article>
                  )
                })
              )}
            </div>

            {/* Pagination Controls before Footer */}
            <div className="uv-pagination-bar">
              <span className="uv-pagination-info">
                Página <strong>{safePage}</strong> de{' '}
                <strong>{totalPages}</strong> ({filteredProducts.length}{' '}
                productos en total)
              </span>

              <div className="uv-pagination-controls">
                <button
                  type="button"
                  className="uv-page-num-btn"
                  disabled={safePage <= 1}
                  onClick={() => handlePageChange(safePage - 1)}
                  aria-label="Página anterior"
                >
                  ←
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`uv-page-num-btn ${pageNum === safePage ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  className="uv-page-next-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => handlePageChange(safePage + 1)}
                >
                  Siguiente página →
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Dark Institutional Footer (only in Login & Catalog) */}
      <UnivalleFooter
        onExploreClick={() => {
          setSelectedCategory('Todos')
          setPriceFilter('all')
          setCurrentPage(1)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    </div>
  )
}

export default CatalogPage
