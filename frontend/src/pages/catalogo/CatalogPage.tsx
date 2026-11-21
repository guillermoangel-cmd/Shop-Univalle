import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { listStoreProfiles, type StoreProfile } from '../../api/usersApi'
import UnivalleFooter from '../../components/footer/UnivalleFooter'
import type { Product } from '../../types/product'
import { parseProductMetadata } from '../../utils/productAttributes'
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
  onAddProduct: (product: Product, quantity?: number) => Promise<void>
  role?: string
  userId: string
  userName: string
  selectedStoreId: string | null
  onOpenProfile: () => void
  onOpenHistory?: () => void
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
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('relevant')
  const [currentPage, setCurrentPage] = useState(1)
  const [addingId, setAddingId] = useState<string | null>(null)

  // Detailed Product Inspection Modal State
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [detailQuantity, setDetailQuantity] = useState<number>(1)
  const [detailFeedback, setDetailFeedback] = useState<string>('')

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
        const [productResponse, categoryResponse, profileData] =
          await Promise.all([
            fetch(`/api/products${query}`, { signal: controller.signal }).catch(
              () => null,
            ),
            fetch(`/api/categories${query}`, {
              signal: controller.signal,
            }).catch(() => null),
            listStoreProfiles().catch(() => [] as StoreProfile[]),
          ])

        let fetchedProducts: Product[] = []
        if (productResponse && productResponse.ok) {
          const rawProducts: unknown = await productResponse.json()
          if (Array.isArray(rawProducts)) {
            fetchedProducts = (rawProducts as Product[]).map((product) => {
              const sellerProfile = profileData.find(
                (p) => p.id === product.profileId,
              )
              return {
                ...product,
                shopName:
                  sellerProfile?.nickname ||
                  (product.profileId === userId
                    ? userName
                    : 'Tienda Comunidad UV'),
              }
            })
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
  }, [selectedStoreId, userId, userName])

  const dynamicCategoryNames = categories
    .map((item) => item.name)
    .filter(
      (name) =>
        !BASE_CATEGORIES.some(
          (base) => normalizeText(base) === normalizeText(name),
        ),
    )

  const sidebarCategories = [...BASE_CATEGORIES, ...dynamicCategoryNames]

  const getSellerName = (product: Product): string => {
    const store = profiles.find((p) => p.id === product.profileId)
    if (store?.nickname) return store.nickname
    if (product.shopName) return product.shopName
    if (product.profileId === userId) return userName
    return 'Vendedor Comunidad UV'
  }

  const filteredProducts = products
    .filter((product) => {
      const matchesCat =
        selectedCategory === 'Todos' ||
        normalizeText(product.category) === normalizeText(selectedCategory)
      const matchesPrice = matchesPriceRange(product.price, priceFilter)
      const matchesStock = !onlyInStock || product.stock > 0
      const sellerName = getSellerName(product)
      const searchable = normalizeText(
        `${product.name} ${product.description} ${product.category} ${sellerName}`,
      )
      const matchesQuery =
        !deferredSearch ||
        deferredSearch
          .split(/\s+/)
          .every((token) => searchable.includes(token))
      return matchesCat && matchesPrice && matchesStock && matchesQuery
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return a.price - b.price
      if (sortBy === 'priceDesc') return b.price - a.price
      if (sortBy === 'nameAsc') return a.name.localeCompare(b.name, 'es')
      return 0
    })

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
  )
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

  const openProductInspector = (product: Product) => {
    const meta = parseProductMetadata(product.description, product.category)
    setInspectedProduct(product)
    setSelectedSize(meta.sizes[0] ?? '')
    setDetailQuantity(1)
    setDetailFeedback('')
  }

  const handleAddClick = async (
    product: Product,
    chosenSize?: string,
    qty = 1,
  ) => {
    setAddingId(product.id)
    try {
      const store = profiles.find((profile) => profile.id === product.profileId)
      const sellerName = getSellerName(product)
      const meta = parseProductMetadata(product.description, product.category)
      const sizeToUse = chosenSize ?? meta.sizes[0] ?? ''

      const variantParts: string[] = [`Vendedor: ${sellerName}`]
      if (sizeToUse) {
        variantParts.push(`Talla/Medida: ${sizeToUse}`)
      }
      if (meta.specs.length > 0) {
        variantParts.push(
          meta.specs.map((s) => `${s.label}: ${s.value}`).join(' · '),
        )
      }

      await onAddProduct(
        {
          ...product,
          description: variantParts.join(' · '),
          profileId: product.profileId || selectedStoreId || 'default-store',
          shopName: sellerName,
          shippingCost: store?.shippingCost ?? 8000,
        },
        qty,
      )

      if (inspectedProduct?.id === product.id) {
        setDetailFeedback(
          `¡Agregado al carrito! (${qty} und.${sizeToUse ? ` · Talla ${sizeToUse}` : ''})`,
        )
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo agregar el producto.',
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

  const activeStoreFilterProfile = selectedStoreId
    ? profiles.find((p) => p.id === selectedStoreId)
    : null

  const inspectedMeta = inspectedProduct
    ? parseProductMetadata(
        inspectedProduct.description,
        inspectedProduct.category,
      )
    : null

  const inspectedStore = inspectedProduct
    ? profiles.find((p) => p.id === inspectedProduct.profileId)
    : null

  const recommendedProducts = inspectedProduct
    ? products
        .filter(
          (p) =>
            p.id !== inspectedProduct.id &&
            (normalizeText(p.category) ===
              normalizeText(inspectedProduct.category) ||
              p.profileId === inspectedProduct.profileId),
        )
        .slice(0, 3)
    : []

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

          <button type="button" className="uv-header-link" onClick={onLogout}>
            CERRAR SESIÓN
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="uv-catalog-main">
        {/* Compact & Modern Catalog View Switcher Bar */}
        <div className="uv-catalog-switcher-bar">
          <div className="uv-catalog-switcher-left">
            <span className="uv-switcher-dot" aria-hidden="true" />
            <div className="uv-switcher-text">
              <strong>Comunidad Univalle ({roleLabel})</strong>
              <span>
                {selectedStoreId === userId
                  ? 'Estás viendo únicamente las publicaciones de tu tienda'
                  : 'Explorando todas las tiendas y productos del campus'}
              </span>
            </div>
          </div>

          <div className="uv-catalog-switcher-controls">
            <div
              className="uv-segmented-control"
              role="group"
              aria-label="Modo de visualización del catálogo"
            >
              <button
                type="button"
                className={`uv-segment-btn ${!selectedStoreId ? 'active' : ''}`}
                aria-pressed={!selectedStoreId}
                onClick={() => onOpenStore('')}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Todo el Catálogo</span>
              </button>

              <button
                type="button"
                className={`uv-segment-btn ${selectedStoreId === userId ? 'active' : ''}`}
                aria-pressed={selectedStoreId === userId}
                onClick={() => onOpenStore(userId)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Mi Tienda</span>
              </button>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="uv-admin-btn"
                onClick={onOpenModeration}
              >
                Moderación
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="catalog-message error" role="alert">
            {error}
          </p>
        )}

        {/* Enhanced Search Engine Bar */}
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
              placeholder="Buscar por producto, vendedor, categoría, talla o característica..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              aria-label="Buscar productos, vendedores o categorías"
            />
            {search && (
              <button
                type="button"
                className="uv-search-clear-btn"
                onClick={() => {
                  setSearch('')
                  setCurrentPage(1)
                }}
              >
                Limpiar
              </button>
            )}
          </label>

          {/* Quick Search Filter Bar */}
          <div className="uv-search-quickbar">
            <span className="uv-search-quick-label">Filtros rápidos:</span>
            <button
              type="button"
              className={`uv-quick-pill ${onlyInStock ? 'active' : ''}`}
              onClick={() => {
                setOnlyInStock((prev) => !prev)
                setCurrentPage(1)
              }}
            >
              ✓ Solo con existencias
            </button>
            {selectedStoreId && (
              <span className="uv-quick-pill active">
                Vendedor:{' '}
                {selectedStoreId === userId
                  ? `${userName} (Mi tienda)`
                  : activeStoreFilterProfile?.nickname || 'Tienda seleccionada'}
                <button
                  type="button"
                  className="uv-quick-pill-remove"
                  onClick={() => onOpenStore('')}
                  title="Quitar filtro de vendedor"
                >
                  ✕
                </button>
              </span>
            )}
            {(selectedCategory !== 'Todos' ||
              priceFilter !== 'all' ||
              Boolean(search) ||
              onlyInStock) && (
              <button
                type="button"
                className="uv-quick-reset-link"
                onClick={() => {
                  setSelectedCategory('Todos')
                  setPriceFilter('all')
                  setSearch('')
                  setOnlyInStock(false)
                  setCurrentPage(1)
                }}
              >
                Restablecer filtros
              </button>
            )}
          </div>
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

            {profiles.length > 0 && (
              <div className="uv-filter-group">
                <h3 className="uv-filter-group-title">TIENDAS / VENDEDORES</h3>
                <button
                  type="button"
                  className={`uv-radio-option ${!selectedStoreId ? 'selected' : ''}`}
                  onClick={() => onOpenStore('')}
                >
                  <span className="uv-radio-circle">
                    {!selectedStoreId && <span className="uv-radio-dot" />}
                  </span>
                  <span>Todas las tiendas</span>
                </button>
                {profiles.slice(0, 6).map((prof) => {
                  const isSelected = selectedStoreId === prof.id
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      className={`uv-radio-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => onOpenStore(prof.id)}
                    >
                      <span className="uv-radio-circle">
                        {isSelected && <span className="uv-radio-dot" />}
                      </span>
                      <span>{prof.nickname}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </aside>

          {/* Right Products Column */}
          <section
            className="uv-products-section"
            aria-live="polite"
            aria-busy={loading}
          >
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
                      : 'Prueba seleccionando otra categoría, vendedor o término de búsqueda.'}
                  </p>
                </div>
              ) : (
                paginatedProducts.map((product) => {
                  const hasCustomImage =
                    Boolean(product.imageUrl) &&
                    !product.imageUrl.includes('producto_default.webp')
                  const sellerName = getSellerName(product)

                  return (
                    <article className="uv-product-card" key={product.id}>
                      <button
                        type="button"
                        className="uv-product-thumb-btn"
                        onClick={() => openProductInspector(product)}
                        title={`Inspeccionar detalles de ${product.name}`}
                      >
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
                          <span className="uv-product-inspect-pill">
                            Ver detalle
                          </span>
                        </div>
                      </button>

                      <p className="uv-product-cat">{product.category}</p>

                      <button
                        type="button"
                        className="uv-product-title-btn"
                        onClick={() => openProductInspector(product)}
                        title={product.name}
                      >
                        <h3 className="uv-product-title">{product.name}</h3>
                      </button>

                      {/* Seller Badge on Catalog Card */}
                      <button
                        type="button"
                        className="uv-product-seller-badge"
                        onClick={() =>
                          product.profileId && onOpenStore(product.profileId)
                        }
                        title={`Ver productos de ${sellerName}`}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>Por: {sellerName}</span>
                      </button>

                      <p className="uv-product-price">
                        {formatPrice(product.price)}
                      </p>

                      <button
                        type="button"
                        className="uv-add-cart-btn"
                        disabled={
                          product.stock < 1 || addingId === product.id
                        }
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

      {/* Product Detail Inspection Modal */}
      {inspectedProduct && inspectedMeta && (
        <div
          className="uv-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="uv-detail-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectedProduct(null)
          }}
        >
          <div className="uv-detail-modal">
            <button
              type="button"
              className="uv-detail-close-btn"
              onClick={() => setInspectedProduct(null)}
              aria-label="Cerrar inspección de producto"
            >
              ✕
            </button>

            <div className="uv-detail-grid">
              {/* Left: Product Visual */}
              <div className="uv-detail-visual">
                <div className="uv-detail-image-box">
                  {inspectedProduct.imageUrl &&
                  !inspectedProduct.imageUrl.includes(
                    'producto_default.webp',
                  ) ? (
                    <img
                      src={inspectedProduct.imageUrl}
                      alt={inspectedProduct.name}
                    />
                  ) : (
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  )}
                </div>

                {/* Seller Card Inside Detail Modal */}
                <div className="uv-detail-seller-card">
                  <div className="uv-detail-seller-avatar">
                    {getSellerName(inspectedProduct).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="uv-detail-seller-info">
                    <span className="uv-detail-seller-kicker">
                      VENDEDOR / TIENDA OFICIAL COMUNIDAD UV
                    </span>
                    <strong>{getSellerName(inspectedProduct)}</strong>
                    <p>
                      {inspectedStore?.address
                        ? `Punto de despacho: ${inspectedStore.address}`
                        : 'Despacho desde Campus Universidad del Valle'}
                    </p>
                  </div>
                  {inspectedProduct.profileId && (
                    <button
                      type="button"
                      className="uv-crud-btn secondary"
                      onClick={() => {
                        const targetId = inspectedProduct.profileId!
                        setInspectedProduct(null)
                        onOpenStore(targetId)
                      }}
                    >
                      Ver su tienda
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Complete Product Info, Sizes, Specs & Add to Cart */}
              <div className="uv-detail-info">
                <div className="uv-detail-badges">
                  <span className="uv-detail-cat-badge">
                    {inspectedProduct.category}
                  </span>
                  <span
                    className={`uv-status-badge ${inspectedProduct.stock > 0 ? 'active' : 'inactive'}`}
                  >
                    {inspectedProduct.stock > 0
                      ? `En inventario: ${inspectedProduct.stock} disponibles`
                      : 'Agotado temporalmente'}
                  </span>
                </div>

                <h2 id="uv-detail-modal-title" className="uv-detail-title">
                  {inspectedProduct.name}
                </h2>

                <div className="uv-detail-price-box">
                  <span className="uv-detail-price">
                    {formatPrice(inspectedProduct.price)}
                  </span>
                  <span className="uv-detail-tax-note">
                    Precio unitario COP · IVA calculado en el resumen del pedido
                  </span>
                </div>

                {/* Size / Variant Selector */}
                {inspectedMeta.sizes.length > 0 && (
                  <div className="uv-detail-section">
                    <div className="uv-detail-section-label">
                      <span>SELECCIONA TALLA / MEDIDA:</span>
                      <strong>{selectedSize || inspectedMeta.sizes[0]}</strong>
                    </div>
                    <div className="uv-size-chips-row">
                      {inspectedMeta.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`uv-size-chip large ${selectedSize === size ? 'active' : ''}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Specs Table */}
                {inspectedMeta.specs.length > 0 && (
                  <div className="uv-detail-section">
                    <span className="uv-detail-section-title">
                      ESPECIFICACIONES DEL PRODUCTO
                    </span>
                    <div className="uv-detail-specs-grid">
                      {inspectedMeta.specs.map((spec) => (
                        <div className="uv-detail-spec-item" key={spec.label}>
                          <span>{spec.label}</span>
                          <strong>{spec.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Description */}
                <div className="uv-detail-section">
                  <span className="uv-detail-section-title">
                    DESCRIPCIÓN DETALLADA
                  </span>
                  <p className="uv-detail-description">
                    {inspectedMeta.cleanDescription}
                  </p>
                </div>

                {/* Quantity & Add to Cart */}
                <div className="uv-detail-purchase-row">
                  <div className="uv-detail-qty-box">
                    <span>Cantidad</span>
                    <div className="uv-qty-control">
                      <button
                        type="button"
                        className="uv-qty-btn"
                        disabled={detailQuantity <= 1}
                        onClick={() =>
                          setDetailQuantity((q) => Math.max(1, q - 1))
                        }
                      >
                        −
                      </button>
                      <span className="uv-qty-value">{detailQuantity}</span>
                      <button
                        type="button"
                        className="uv-qty-btn"
                        disabled={detailQuantity >= inspectedProduct.stock}
                        onClick={() =>
                          setDetailQuantity((q) =>
                            Math.min(inspectedProduct.stock, q + 1),
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="uv-detail-add-btn"
                    disabled={
                      inspectedProduct.stock < 1 ||
                      addingId === inspectedProduct.id
                    }
                    onClick={() =>
                      void handleAddClick(
                        inspectedProduct,
                        selectedSize || inspectedMeta.sizes[0],
                        detailQuantity,
                      )
                    }
                  >
                    {addingId === inspectedProduct.id
                      ? 'AGREGANDO AL CARRITO...'
                      : inspectedProduct.stock > 0
                        ? `AGREGAR AL CARRITO · ${formatPrice(inspectedProduct.price * detailQuantity)}`
                        : 'PRODUCTO AGOTADO'}
                  </button>
                </div>

                {detailFeedback && (
                  <div className="uv-detail-feedback" role="status">
                    <span>{detailFeedback}</span>
                    <button
                      type="button"
                      className="uv-detail-go-cart"
                      onClick={() => {
                        setInspectedProduct(null)
                        onOpenCart()
                      }}
                    >
                      Ir al carrito →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations Section (Ready for Recommendations Microservice) */}
            {recommendedProducts.length > 0 && (
              <div className="uv-detail-recommendations">
                <div className="uv-detail-rec-header">
                  <div>
                    <span className="uv-subpage-eyebrow">
                      SUGERENCIAS INTELIGENTES
                    </span>
                    <h3>Productos Recomendados Relacionados</h3>
                  </div>
                  <span className="uv-role-pill">
                    Módulo de Recomendaciones
                  </span>
                </div>
                <div className="uv-detail-rec-grid">
                  {recommendedProducts.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      className="uv-detail-rec-card"
                      onClick={() => openProductInspector(rec)}
                    >
                      <strong>{rec.name}</strong>
                      <span>
                        {rec.category} · Por: {getSellerName(rec)}
                      </span>
                      <span className="uv-detail-rec-price">
                        {formatPrice(rec.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
