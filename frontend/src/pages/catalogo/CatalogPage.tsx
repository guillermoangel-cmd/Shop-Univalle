import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import type { Product } from '../../types/product'
import AdminCatalogPanel, { type CatalogCategory } from './AdminCatalogPanel'
import '../../App.css'

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface CatalogPageProps {
  accessToken: string
  role: string
  onLogout: () => void
}

function CatalogPage({ accessToken, role, onLogout }: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [bagCount, setBagCount] = useState(0)
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase('es'))

  useEffect(() => {
    const controller = new AbortController()

    async function loadCatalog() {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          fetch('/api/products', { signal: controller.signal }),
          fetch('/api/categories', { signal: controller.signal }),
        ])
        if (!productResponse.ok) throw new Error('No fue posible consultar los productos.')
        if (!categoryResponse.ok) throw new Error('No fue posible consultar las categorías.')

        const [productData, categoryData] = await Promise.all([
          productResponse.json() as Promise<unknown>,
          categoryResponse.json() as Promise<unknown>,
        ])
        if (!Array.isArray(productData) || !Array.isArray(categoryData)) {
          throw new Error('La respuesta del catálogo no es válida.')
        }
        startTransition(() => {
          setProducts(productData as Product[])
          setCategories(categoryData as CatalogCategory[])
        })
        setError('')
      } catch (cause: unknown) {
        if (!controller.signal.aborted) {
          const message = cause instanceof Error ? cause.message : 'Error al cargar el catálogo.'
          setError(message)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadCatalog()

    return () => controller.abort()
  }, [refreshKey])

  const categoryNames = [...new Set([
    ...categories.map((item) => item.name),
    ...products.map((product) => product.category),
  ])]
  const refreshCatalog = () => setRefreshKey((key) => key + 1)
  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === 'Todas' || product.category === category
    const searchableText = `${product.name} ${product.description} ${product.category}`
      .toLocaleLowerCase('es')
    return matchesCategory && searchableText.includes(deferredSearch)
  })

  return (
    <div className="store-shell">
      <div className="utility-bar">
        <span>Univalle Shop · Sede Norte del Cauca, Colombia</span>
        <span>Un espacio para la comunidad universitaria</span>
      </div>

      <header className="main-header">
        <a className="wordmark" href="/" aria-label="Univalle Shop, inicio">
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
          <button className="bag-button" type="button" title="Carrito de demostración">
            Mi bolsa <span aria-label={`${bagCount} productos`}>{bagCount}</span>
          </button>
          {role === 'ADMINISTRADOR' && <span className="role-badge">Administrador</span>}
          <button className="logout-button" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
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

        {role === 'ADMINISTRADOR' && (
          <AdminCatalogPanel
            accessToken={accessToken}
            categories={categories}
            onChanged={refreshCatalog}
          />
        )}

        <section className="catalog-toolbar" aria-label="Filtros del catálogo">
          <span className="results-count">
            {loading ? 'Cargando catálogo…' : `${visibleProducts.length} productos`}
          </span>
          <label className="category-filter">
            <span>Categoría</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option>Todas</option>
              {categoryNames.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </section>

        <section className="product-grid" aria-live="polite" aria-busy={loading}>
          {loading && <p className="catalog-message">Cargando productos…</p>}
          {!loading && error && (
            <div className="catalog-message error" role="alert">
              <strong>No pudimos abrir el catálogo</strong>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && visibleProducts.length === 0 && (
            <div className="catalog-message">
              <strong>{products.length ? 'Sin coincidencias' : 'Pronto habrá productos aquí'}</strong>
              <span>{products.length ? 'Prueba otra búsqueda o categoría.' : 'El catálogo todavía no tiene productos publicados.'}</span>
            </div>
          )}
          {!loading && !error && visibleProducts.map((product, index) => (
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
                  disabled={product.stock < 1}
                  onClick={() => setBagCount((count) => count + 1)}
                >
                  {product.stock > 0 ? 'Añadir' : 'Agotado'}
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="site-footer">
        <span>Univalle Shop · Proyecto académico</span>
        <span>Carrito de demostración · Pedidos en desarrollo</span>
      </footer>
    </div>
  )
}

export default CatalogPage