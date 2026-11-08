import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { DEFAULT_UNIVALLE_PRODUCTS } from '../../services/ordersApi'
import type { Product } from '../../types/product'
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
  onLogout: () => void
}

function CatalogPage({
  bagCount,
  onOpenCart,
  onAddProduct,
  onLogout,
}: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [addingId, setAddingId] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase('es'))

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/products', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('No fue posible consultar el catálogo.')
        return response.json() as Promise<unknown>
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          startTransition(() => setProducts(data as Product[]))
        } else {
          startTransition(() => setProducts(DEFAULT_UNIVALLE_PRODUCTS))
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          startTransition(() => setProducts(DEFAULT_UNIVALLE_PRODUCTS))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const categories = ['Todas', ...new Set(products.map((product) => product.category))]
  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === 'Todas' || product.category === category
    const searchableText = `${product.name} ${product.description} ${product.category}`
      .toLocaleLowerCase('es')
    return matchesCategory && searchableText.includes(deferredSearch)
  })

  const handleAddClick = async (product: Product) => {
    setAddingId(product.id)
    try {
      await onAddProduct(product)
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

        <button
          className="bag-button"
          type="button"
          onClick={onOpenCart}
          title="Ver mi carrito de compras"
        >
          Mi bolsa <span aria-label={`${bagCount} productos`}>{bagCount}</span>
        </button>
        <button className="logout-button" type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </header>

      <main>
        <section className="catalog-intro">
          <div>
            <p className="eyebrow">Hecho en comunidad</p>
            <h1>El catálogo Univalle</h1>
          </div>
          <p className="intro-note">
            Productos, proyectos y creaciones de estudiantes, docentes y equipos de la Universidad.
          </p>
        </section>

        <section className="catalog-toolbar" aria-label="Filtros del catálogo">
          <span className="results-count">
            {loading ? 'Cargando catálogo…' : `${visibleProducts.length} productos`}
          </span>
          <label className="category-filter">
            <span>Categoría</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </section>

        <section className="product-grid" aria-live="polite" aria-busy={loading}>
          {loading && <p className="catalog-message">Cargando productos…</p>}
          {!loading && visibleProducts.length === 0 && (
            <div className="catalog-message">
              <strong>{products.length ? 'Sin coincidencias' : 'Pronto habrá productos aquí'}</strong>
              <span>{products.length ? 'Prueba otra búsqueda o categoría.' : 'El catálogo todavía no tiene productos publicados.'}</span>
            </div>
          )}
          {!loading && visibleProducts.map((product, index) => (
            <article className="product-card" key={product.id} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
              <div className="product-media">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} loading="lazy" />
                ) : (
                  <span className="image-fallback">{product.category}</span>
                )}
              </div>
              <p className="product-category">{product.category}</p>
              <h2>{product.name}</h2>
              <p className="product-description">{product.description || 'Una creación de la comunidad universitaria.'}</p>
              <div className="product-buy-row">
                <span className="product-price">{currency.format(product.price)}</span>
                <button
                  className="add-button"
                  type="button"
                  disabled={product.stock < 1 || addingId === product.id}
                  onClick={() => void handleAddClick(product)}
                >
                  {addingId === product.id
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
