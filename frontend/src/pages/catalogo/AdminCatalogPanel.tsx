import { useEffect, useState, type FormEvent } from 'react'
import { deleteProductImage, uploadProductImage } from '../../api/uploadsApi'
import { DEFAULT_PRODUCT_IMAGE, type Product } from '../../types/product'
import './CatalogPage.css'

export interface CatalogCategory {
  id: string
  name: string
  description: string
  profileId?: string
  active?: boolean
}

interface AdminCatalogPanelProps {
  accessToken: string
  userName?: string
  role?: string
  bagCount?: number
  onBack?: () => void
  onOpenProfile?: () => void
  onOpenCart?: () => void
  onOpenModeration?: () => void
  onLogout?: () => void
  onChanged?: () => void
}

async function adminRequest(
  path: string,
  accessToken: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (response.ok) return
  let message = 'No se pudo completar la operación.'
  try {
    const result = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(result.message)) message = result.message.join(' ')
    else if (result.message) message = result.message
  } catch {
    // Keep the default message when the response body is empty.
  }
  throw new Error(message)
}

function isUploadedProductImage(imageUrl: string): boolean {
  try {
    const parsed = new URL(imageUrl, window.location.origin)
    return parsed.pathname.startsWith('/uploads/products/')
  } catch {
    return false
  }
}

function CategoryRow({
  category,
  accessToken,
  onChanged,
  onError,
}: {
  category: CatalogCategory
  accessToken: string
  onChanged: () => void
  onError: (message: string) => void
}) {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(category.name)
    setDescription(category.description)
  }, [category.description, category.name])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    onError('')
    try {
      await adminRequest(
        `/api/categories/${encodeURIComponent(category.id)}`,
        accessToken,
        'PATCH',
        {
          name: name.trim(),
          description: description.trim(),
        },
      )
      onChanged()
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la categoría.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return
    setSaving(true)
    onError('')
    try {
      await adminRequest(
        `/api/categories/${encodeURIComponent(category.id)}`,
        accessToken,
        'DELETE',
      )
      onChanged()
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la categoría.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function restore() {
    setSaving(true)
    onError('')
    try {
      await adminRequest(
        `/api/categories/${encodeURIComponent(category.id)}/restore`,
        accessToken,
        'PATCH',
      )
      onChanged()
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'No se pudo reactivar la categoría.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="uv-crud-item-row" onSubmit={(event) => void save(event)}>
      <div className="uv-crud-row-fields">
        <label className="uv-crud-field">
          <span>Nombre de categoría</span>
          <input
            required
            maxLength={80}
            disabled={!category.active || saving}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="uv-crud-field">
          <span>Descripción</span>
          <input
            maxLength={240}
            disabled={!category.active || saving}
            value={description}
            placeholder="Sin descripción"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </div>
      <div className="uv-crud-row-actions">
        <span
          className={`uv-status-badge ${category.active ? 'active' : 'inactive'}`}
        >
          {category.active ? 'Activa' : 'Inactiva'}
        </span>
        {category.active ? (
          <>
            <button
              className="uv-crud-btn secondary"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              className="uv-crud-btn danger"
              type="button"
              disabled={saving}
              onClick={() => void remove()}
            >
              Eliminar
            </button>
          </>
        ) : (
          <button
            className="uv-crud-btn secondary"
            type="button"
            disabled={saving}
            onClick={() => void restore()}
          >
            Reactivar
          </button>
        )}
      </div>
    </form>
  )
}

function ProductRow({
  product,
  categories,
  accessToken,
  onChanged,
  onError,
}: {
  product: Product
  categories: CatalogCategory[]
  accessToken: string
  onChanged: () => void
  onError: (message: string) => void
}) {
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description)
  const [imageUrl, setImageUrl] = useState(
    product.imageUrl || DEFAULT_PRODUCT_IMAGE,
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [categoryId, setCategoryId] = useState(product.categoryId ?? '')
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(product.name)
    setDescription(product.description)
    setImageUrl(product.imageUrl || DEFAULT_PRODUCT_IMAGE)
    setImageFile(null)
    setCategoryId(product.categoryId ?? '')
    setPrice(String(product.price))
    setStock(String(product.stock))
  }, [product])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    onError('')
    try {
      const savedImageUrl = imageFile
        ? await uploadProductImage(accessToken, imageFile)
        : imageUrl.trim() || DEFAULT_PRODUCT_IMAGE
      await adminRequest(
        `/api/products/${encodeURIComponent(product.id)}`,
        accessToken,
        'PATCH',
        {
          name: name.trim(),
          description: description.trim(),
          imageUrl: savedImageUrl,
          categoryId,
          price: Number(price),
          stock: Number(stock),
        },
      )
      onChanged()
      if (
        product.imageUrl &&
        isUploadedProductImage(product.imageUrl) &&
        product.imageUrl !== savedImageUrl
      ) {
        const deleted = await deleteProductImage(
          accessToken,
          product.id,
          product.imageUrl,
        )
        if (!deleted) {
          onError(
            'El producto se guardó; la imagen anterior se conserva porque aún está en uso.',
          )
        }
      }
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el producto.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (
      !window.confirm(`¿Eliminar el producto "${product.name}" del catálogo?`)
    )
      return
    setSaving(true)
    onError('')
    try {
      if (product.imageUrl && isUploadedProductImage(product.imageUrl)) {
        await adminRequest(
          `/api/products/${encodeURIComponent(product.id)}`,
          accessToken,
          'PATCH',
          {
            imageUrl: DEFAULT_PRODUCT_IMAGE,
          },
        )
        onChanged()
        const deleted = await deleteProductImage(
          accessToken,
          product.id,
          product.imageUrl,
        )
        if (!deleted) {
          onError(
            'El producto se eliminará; la imagen se conserva porque aún está en uso.',
          )
        }
      }
      await adminRequest(
        `/api/products/${encodeURIComponent(product.id)}`,
        accessToken,
        'DELETE',
      )
      onChanged()
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el producto.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function restore() {
    setSaving(true)
    onError('')
    try {
      await adminRequest(
        `/api/products/${encodeURIComponent(product.id)}/restore`,
        accessToken,
        'PATCH',
      )
      onChanged()
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'No se pudo reactivar el producto.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="uv-crud-product-card" onSubmit={(event) => void save(event)}>
      <div className="uv-crud-product-top">
        <img
          src={imageUrl}
          alt={product.name}
          className="uv-crud-product-thumb"
          onError={(event) => {
            if (
              event.currentTarget.src !==
              new URL(DEFAULT_PRODUCT_IMAGE, window.location.href).href
            ) {
              event.currentTarget.src = DEFAULT_PRODUCT_IMAGE
            }
          }}
        />
        <div className="uv-crud-product-main-fields">
          <div className="uv-crud-grid-2">
            <label className="uv-crud-field">
              <span>Nombre del producto</span>
              <input
                required
                maxLength={120}
                disabled={!product.active || saving}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="uv-crud-field">
              <span>Categoría</span>
              <select
                required
                disabled={!product.active || saving}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">Selecciona</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="uv-crud-field">
            <span>Descripción</span>
            <input
              maxLength={1000}
              disabled={!product.active || saving}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="uv-crud-grid-4">
            <label className="uv-crud-field">
              <span>Precio (COP)</span>
              <input
                required
                type="number"
                min="1"
                step="1"
                disabled={!product.active || saving}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>
            <label className="uv-crud-field">
              <span>Existencias</span>
              <input
                required
                type="number"
                min="0"
                step="1"
                disabled={!product.active || saving}
                value={stock}
                onChange={(event) => setStock(event.target.value)}
              />
            </label>
            <label className="uv-crud-field">
              <span>URL de imagen</span>
              <input
                disabled={!product.active || saving || Boolean(imageFile)}
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </label>
            <label className="uv-crud-field">
              <span>Reemplazar archivo</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={!product.active || saving}
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
        </div>
      </div>

      <div className="uv-crud-product-footer">
        <span
          className={`uv-status-badge ${product.active ? 'active' : 'inactive'}`}
        >
          {product.active ? 'Publicado' : 'Eliminado'}
        </span>

        <div className="uv-crud-row-actions">
          {product.active ? (
            <>
              <button
                className="uv-crud-btn secondary"
                type="button"
                disabled={
                  saving || (imageUrl === DEFAULT_PRODUCT_IMAGE && !imageFile)
                }
                onClick={() => {
                  setImageUrl(DEFAULT_PRODUCT_IMAGE)
                  setImageFile(null)
                }}
              >
                Imagen por defecto
              </button>
              <button
                className="uv-crud-btn primary"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                className="uv-crud-btn danger"
                type="button"
                disabled={saving}
                onClick={() => void remove()}
              >
                Eliminar
              </button>
            </>
          ) : (
            <button
              className="uv-crud-btn secondary"
              type="button"
              disabled={saving}
              onClick={() => void restore()}
            >
              Reactivar producto
            </button>
          )}
        </div>
      </div>
    </form>
  )
}

function AdminCatalogPanel({
  accessToken,
  userName = 'Usuario',
  role = 'ADMINISTRATIVO',
  bagCount = 0,
  onBack,
  onOpenProfile,
  onOpenCart,
  onOpenModeration,
  onLogout,
  onChanged,
}: AdminCatalogPanelProps) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productImage, setProductImage] = useState('')
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productCategory, setProductCategory] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productStock, setProductStock] = useState('')
  const [managedCategories, setManagedCategories] = useState<CatalogCategory[]>(
    [],
  )
  const [managedProducts, setManagedProducts] = useState<Product[]>([])
  const [categoryLoadError, setCategoryLoadError] = useState('')
  const [productLoadError, setProductLoadError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const isAdmin = role === 'ADMINISTRATIVO' || role === 'ADMINISTRADOR'
  const roleLabel = isAdmin
    ? 'Administrador'
    : role === 'DOCENTE'
      ? 'Docente'
      : 'Estudiante'

  const activeCategories = managedCategories.filter(
    (category) => category.active !== false,
  )
  const effectiveCategoryId =
    productCategory && activeCategories.some((c) => c.id === productCategory)
      ? productCategory
      : activeCategories[0]?.id ?? ''

  async function refreshManagedCategories() {
    try {
      const response = await fetch('/api/categories/manage', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        const result = (await response.json()) as { message?: string }
        throw new Error(
          result.message || 'No se pudieron consultar las categorías.',
        )
      }
      const result = (await response.json()) as unknown
      if (!Array.isArray(result))
        throw new Error('La respuesta de categorías no es válida.')
      setManagedCategories(result as CatalogCategory[])
      setCategoryLoadError('')
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudieron consultar las categorías.'
      setCategoryLoadError(errorMessage)
      setMessage(errorMessage)
    }
  }

  async function refreshManagedProducts() {
    try {
      const response = await fetch('/api/products/manage', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        const result = (await response.json()) as { message?: string }
        throw new Error(
          result.message || 'No se pudieron consultar los productos.',
        )
      }
      const result = (await response.json()) as unknown
      if (!Array.isArray(result))
        throw new Error('La respuesta de productos no es válida.')
      setManagedProducts(result as Product[])
      setProductLoadError('')
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudieron consultar los productos.'
      setProductLoadError(errorMessage)
      setMessage(errorMessage)
    }
  }

  useEffect(() => {
    let active = true
    const headers = { Authorization: `Bearer ${accessToken}` }
    Promise.all([
      fetch('/api/categories/manage', { headers }),
      fetch('/api/products/manage', { headers }),
    ])
      .then(async ([categoryResponse, productResponse]) => {
        const [categoryData, productData] = await Promise.all([
          categoryResponse.json() as Promise<unknown>,
          productResponse.json() as Promise<unknown>,
        ])
        if (!categoryResponse.ok)
          throw new Error('No se pudieron consultar las categorías.')
        if (!productResponse.ok)
          throw new Error('No se pudieron consultar los productos.')
        if (!Array.isArray(categoryData))
          throw new Error('La respuesta de categorías no es válida.')
        if (!Array.isArray(productData))
          throw new Error('La respuesta de productos no es válida.')
        if (active) {
          setManagedCategories(categoryData as CatalogCategory[])
          setManagedProducts(productData as Product[])
          setCategoryLoadError('')
          setProductLoadError('')
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el catálogo de gestión.'
        setCategoryLoadError(errorMessage)
        setProductLoadError(errorMessage)
        setMessage(errorMessage)
      })
    return () => {
      active = false
    }
  }, [accessToken])

  function refreshAfterCategoryChange() {
    onChanged?.()
    void refreshManagedCategories()
    void refreshManagedProducts()
  }

  function refreshAfterProductChange() {
    onChanged?.()
    void refreshManagedProducts()
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await adminRequest('/api/categories', accessToken, 'POST', {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
      })
      setCategoryName('')
      setCategoryDescription('')
      setMessage('Categoría creada correctamente.')
      refreshAfterCategoryChange()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo crear la categoría.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const imageUrl = productImageFile
        ? await uploadProductImage(accessToken, productImageFile)
        : productImage.trim() || DEFAULT_PRODUCT_IMAGE
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName.trim(),
          description: productDescription.trim(),
          imageUrl,
          categoryId: effectiveCategoryId,
          price: Number(productPrice),
          stock: Number(productStock),
        }),
      })
      if (!response.ok) {
        const result = (await response.json()) as {
          message?: string | string[]
        }
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(' ')
            : result.message || 'No se pudo publicar el producto.',
        )
      }
      setProductName('')
      setProductDescription('')
      setProductImage('')
      setProductImageFile(null)
      setProductPrice('')
      setProductStock('')
      setMessage('Producto publicado exitosamente en el catálogo.')
      refreshAfterProductChange()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo publicar el producto.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="uv-catalog-page">
      {/* Top Header */}
      <header className="uv-catalog-header">
        <button
          type="button"
          className="uv-header-brand"
          onClick={onBack}
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
            className="uv-header-tab"
            onClick={onBack}
          >
            CATÁLOGO
          </button>
          <button type="button" className="uv-header-tab active">
            GESTIÓN CRUD
          </button>
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
            {roleLabel} · {userName}
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
        {/* Page Header Banner */}
        <div className="uv-subpage-hero">
          <div>
            <p className="uv-subpage-eyebrow">
              PANEL DE ADMINISTRACIÓN DE TIENDA · {roleLabel.toUpperCase()}
            </p>
            <h1 id="admin-catalog-title" className="uv-subpage-title">
              Gestionar Productos y Categorías (CRUD)
            </h1>
            <p className="uv-subpage-desc">
              Crea categorías, publica nuevos productos con imagen y actualiza
              precios o existencias de tu tienda en tiempo real.
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              className="uv-admin-btn"
              onClick={onBack}
            >
              ← Volver al Catálogo
            </button>
          )}
        </div>

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

        {/* Creation Forms Grid */}
        <div className="uv-crud-forms-grid">
          <form className="uv-crud-card" onSubmit={createCategory}>
            <div className="uv-crud-card-header">
              <h2>1. Crear Categoría</h2>
              <span>Organiza tu catálogo</span>
            </div>
            <label className="uv-crud-field">
              <span>Nombre de la categoría</span>
              <input
                required
                maxLength={80}
                placeholder="Ej. Ropa Institucional, Libros, Tecnología"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
              />
            </label>
            <label className="uv-crud-field">
              <span>Descripción (opcional)</span>
              <input
                maxLength={240}
                placeholder="Breve descripción de la categoría"
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
              />
            </label>
            <button
              className="uv-crud-btn primary full"
              type="submit"
              disabled={saving}
            >
              + Crear Categoría
            </button>
          </form>

          <form className="uv-crud-card" onSubmit={createProduct}>
            <div className="uv-crud-card-header">
              <h2>2. Publicar Nuevo Producto</h2>
              <span>Visible en el catálogo</span>
            </div>
            <div className="uv-crud-grid-2">
              <label className="uv-crud-field">
                <span>Nombre del producto</span>
                <input
                  required
                  maxLength={120}
                  placeholder="Ej. Sudadera Univalle"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                />
              </label>
              <label className="uv-crud-field">
                <span>Categoría</span>
                <select
                  required
                  value={effectiveCategoryId}
                  onChange={(event) => setProductCategory(event.target.value)}
                >
                  {activeCategories.length === 0 && (
                    <option value="">Selecciona una categoría</option>
                  )}
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="uv-crud-field">
              <span>Descripción</span>
              <textarea
                maxLength={1000}
                rows={2}
                placeholder="Detalles, talla, material o edición..."
                value={productDescription}
                onChange={(event) => setProductDescription(event.target.value)}
              />
            </label>

            <div className="uv-crud-grid-2">
              <label className="uv-crud-field">
                <span>Precio (COP)</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  placeholder="45000"
                  value={productPrice}
                  onChange={(event) => setProductPrice(event.target.value)}
                />
              </label>
              <label className="uv-crud-field">
                <span>Existencias (Stock)</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  placeholder="15"
                  value={productStock}
                  onChange={(event) => setProductStock(event.target.value)}
                />
              </label>
            </div>

            <div className="uv-crud-grid-2">
              <label className="uv-crud-field">
                <span>URL de imagen (opcional)</span>
                <input
                  type="url"
                  placeholder="https://..."
                  disabled={Boolean(productImageFile)}
                  value={productImage}
                  onChange={(event) => setProductImage(event.target.value)}
                />
              </label>
              <label className="uv-crud-field">
                <span>O subir imagen (PNG, JPG, WebP)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setProductImageFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>

            <button
              className="uv-crud-btn primary full"
              type="submit"
              disabled={saving || activeCategories.length === 0}
            >
              {saving ? 'Publicando…' : '+ Publicar Producto en Catálogo'}
            </button>
            {activeCategories.length === 0 && (
              <p className="uv-crud-hint">
                Primero crea al menos una categoría a la izquierda para poder
                publicar productos.
              </p>
            )}
          </form>
        </div>

        {/* Existing Categories List */}
        <section className="uv-crud-section">
          <div className="uv-crud-section-header">
            <h2>Mis Categorías ({managedCategories.length})</h2>
            <span>Edita el nombre o estado de tus categorías</span>
          </div>
          {categoryLoadError ? (
            <p className="uv-crud-empty" role="alert">
              {categoryLoadError}
            </p>
          ) : managedCategories.length === 0 ? (
            <p className="uv-crud-empty">
              Aún no has registrado categorías en tu tienda.
            </p>
          ) : (
            <div className="uv-crud-list">
              {managedCategories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  accessToken={accessToken}
                  onChanged={refreshAfterCategoryChange}
                  onError={setMessage}
                />
              ))}
            </div>
          )}
        </section>

        {/* Existing Products List */}
        <section className="uv-crud-section">
          <div className="uv-crud-section-header">
            <h2>Mis Productos Publicados ({managedProducts.length})</h2>
            <span>Actualiza precios, stock, imágenes o estado</span>
          </div>
          {productLoadError ? (
            <p className="uv-crud-empty" role="alert">
              {productLoadError}
            </p>
          ) : managedProducts.length === 0 ? (
            <p className="uv-crud-empty">
              Aún no has publicado productos en tu tienda.
            </p>
          ) : (
            <div className="uv-crud-list">
              {managedProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  categories={activeCategories}
                  accessToken={accessToken}
                  onChanged={refreshAfterProductChange}
                  onError={setMessage}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default AdminCatalogPanel
