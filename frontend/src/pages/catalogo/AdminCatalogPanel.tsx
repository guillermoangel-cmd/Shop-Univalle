import { useEffect, useState, type FormEvent } from 'react'
import { deleteProductImage, uploadProductImage } from '../../api/uploadsApi'
import { DEFAULT_PRODUCT_IMAGE, type Product } from '../../types/product'
import {
  ACCESSORY_SIZES,
  CLOTHING_SIZES,
  buildProductDescription,
  detectCategoryTemplate,
  parseProductMetadata,
} from '../../utils/productAttributes'
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
  onOpenHistory?: () => void
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
  const initialParsed = parseProductMetadata(
    product.description,
    product.category,
  )
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(initialParsed.cleanDescription)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialParsed.sizes,
  )
  const [attrPrimary, setAttrPrimary] = useState(
    initialParsed.specs[0]?.value ?? '',
  )
  const [attrSecondary, setAttrSecondary] = useState(
    initialParsed.specs[1]?.value ?? '',
  )
  const [imageUrl, setImageUrl] = useState(
    product.imageUrl || DEFAULT_PRODUCT_IMAGE,
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [categoryId, setCategoryId] = useState(product.categoryId ?? '')
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const parsed = parseProductMetadata(product.description, product.category)
    setName(product.name)
    setDescription(parsed.cleanDescription)
    setSelectedSizes(parsed.sizes)
    setAttrPrimary(parsed.specs[0]?.value ?? '')
    setAttrSecondary(parsed.specs[1]?.value ?? '')
    setImageUrl(product.imageUrl || DEFAULT_PRODUCT_IMAGE)
    setImageFile(null)
    setCategoryId(product.categoryId ?? '')
    setPrice(String(product.price))
    setStock(String(product.stock))
  }, [product])

  const currentCatName =
    categories.find((c) => c.id === categoryId)?.name || product.category
  const template = detectCategoryTemplate(currentCatName)

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    )
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    onError('')
    try {
      const savedImageUrl = imageFile
        ? await uploadProductImage(accessToken, imageFile)
        : imageUrl.trim() || DEFAULT_PRODUCT_IMAGE

      const attributes: Record<string, string> = {}
      if (template === 'clothing') {
        if (attrPrimary.trim()) attributes['Material'] = attrPrimary.trim()
        if (attrSecondary.trim()) attributes['Color'] = attrSecondary.trim()
      } else if (template === 'books') {
        if (attrPrimary.trim()) attributes['Autor/Editorial'] = attrPrimary.trim()
        if (attrSecondary.trim()) attributes['Edición/Estado'] = attrSecondary.trim()
      } else if (template === 'tech') {
        if (attrPrimary.trim()) attributes['Marca/Modelo'] = attrPrimary.trim()
        if (attrSecondary.trim()) attributes['Garantía/Detalle'] = attrSecondary.trim()
      } else {
        if (attrPrimary.trim()) attributes['Material/Detalle'] = attrPrimary.trim()
        if (attrSecondary.trim()) attributes['Estado'] = attrSecondary.trim()
      }

      const allowedForEdit =
        template === 'clothing'
          ? CLOTHING_SIZES
          : template === 'accessories'
            ? ACCESSORY_SIZES
            : []

      const fullDescription = buildProductDescription(description, {
        sizes: selectedSizes.filter((s) => allowedForEdit.includes(s)),
        attributes,
      })

      await adminRequest(
        `/api/products/${encodeURIComponent(product.id)}`,
        accessToken,
        'PATCH',
        {
          name: name.trim(),
          description: fullDescription,
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
    <form
      className="uv-crud-product-card"
      onSubmit={(event) => void save(event)}
    >
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
            <span>Descripción principal</span>
            <input
              maxLength={800}
              disabled={!product.active || saving}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          {/* Dynamic Category Options in Edit Row */}
          {(template === 'clothing' || template === 'accessories') && (
            <div className="uv-crud-field">
              <span>
                {template === 'clothing'
                  ? 'Tallas disponibles (clic para activar/desactivar)'
                  : 'Presentación / Medida disponible'}
              </span>
              <div className="uv-size-chips-row">
                {(template === 'clothing' ? CLOTHING_SIZES : ACCESSORY_SIZES).map(
                  (sz) => {
                    const active = selectedSizes.includes(sz)
                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={!product.active || saving}
                        className={`uv-size-chip ${active ? 'active' : ''}`}
                        onClick={() => toggleSize(sz)}
                      >
                        {sz}
                      </button>
                    )
                  },
                )}
              </div>
            </div>
          )}

          <div className="uv-crud-grid-2">
            <label className="uv-crud-field">
              <span>
                {template === 'clothing'
                  ? 'Material / Tela'
                  : template === 'books'
                    ? 'Autor / Editorial'
                    : template === 'tech'
                      ? 'Marca / Modelo'
                      : 'Material / Especificación'}
              </span>
              <input
                maxLength={120}
                disabled={!product.active || saving}
                value={attrPrimary}
                placeholder="Opcional"
                onChange={(e) => setAttrPrimary(e.target.value)}
              />
            </label>
            <label className="uv-crud-field">
              <span>
                {template === 'clothing'
                  ? 'Color / Estilo'
                  : template === 'books'
                    ? 'Edición / Estado'
                    : template === 'tech'
                      ? 'Garantía / Condición'
                      : 'Condición / Detalle'}
              </span>
              <input
                maxLength={120}
                disabled={!product.active || saving}
                value={attrSecondary}
                placeholder="Opcional"
                onChange={(e) => setAttrSecondary(e.target.value)}
              />
            </label>
          </div>

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
  onOpenHistory,
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

  // Dynamic category-dependent fields for creation
  const [newSizes, setNewSizes] = useState<string[]>([])
  const [newAttrPrimary, setNewAttrPrimary] = useState('')
  const [newAttrSecondary, setNewAttrSecondary] = useState('')

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

  const selectedCategoryObj = activeCategories.find(
    (c) => c.id === effectiveCategoryId,
  )
  const createTemplate = detectCategoryTemplate(selectedCategoryObj?.name ?? '')

  const handleToggleNewSize = (size: string) => {
    setNewSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    )
  }

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

      const attributes: Record<string, string> = {}
      if (createTemplate === 'clothing') {
        if (newAttrPrimary.trim()) attributes['Material'] = newAttrPrimary.trim()
        if (newAttrSecondary.trim()) attributes['Color'] = newAttrSecondary.trim()
      } else if (createTemplate === 'books') {
        if (newAttrPrimary.trim())
          attributes['Autor/Editorial'] = newAttrPrimary.trim()
        if (newAttrSecondary.trim())
          attributes['Edición/Estado'] = newAttrSecondary.trim()
      } else if (createTemplate === 'tech') {
        if (newAttrPrimary.trim())
          attributes['Marca/Modelo'] = newAttrPrimary.trim()
        if (newAttrSecondary.trim())
          attributes['Garantía/Detalle'] = newAttrSecondary.trim()
      } else {
        if (newAttrPrimary.trim())
          attributes['Material/Detalle'] = newAttrPrimary.trim()
        if (newAttrSecondary.trim()) attributes['Estado'] = newAttrSecondary.trim()
      }

      const allowedForCreate =
        createTemplate === 'clothing'
          ? CLOTHING_SIZES
          : createTemplate === 'accessories'
            ? ACCESSORY_SIZES
            : []

      const fullDescription = buildProductDescription(productDescription, {
        sizes: newSizes.filter((s) => allowedForCreate.includes(s)),
        attributes,
      })

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName.trim(),
          description: fullDescription,
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
      setNewAttrPrimary('')
      setNewAttrSecondary('')
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
          {onOpenProfile && (
            <button
              type="button"
              className="uv-header-tab"
              onClick={onOpenProfile}
            >
              MI PERFIL
            </button>
          )}
          {onOpenHistory && (
            <button
              type="button"
              className="uv-header-tab"
              onClick={onOpenHistory}
            >
              HISTORIAL
            </button>
          )}
          <button type="button" className="uv-header-tab active">
            GESTIÓN
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
            <button type="button" className="uv-header-link" onClick={onLogout}>
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
              Gestión de Productos y Categorías
            </h1>
            <p className="uv-subpage-desc">
              Crea categorías y publica productos con atributos dinámicos según
              su tipo (tallas para ropa, autor/editorial para libros, marca/modelo
              para tecnología o medidas para accesorios).
            </p>
          </div>
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
              <span>Activa campos dinámicos por tipo</span>
            </div>
            <label className="uv-crud-field">
              <span>Nombre de la categoría</span>
              <input
                required
                maxLength={80}
                placeholder="Ej. Ropa, Libros, Tecnología, Accesorios"
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
              <span>
                Plantilla activa:{' '}
                <strong>
                  {createTemplate === 'clothing'
                    ? 'Ropa y Calzado (con Tallas)'
                    : createTemplate === 'books'
                      ? 'Libros y Material Académico'
                      : createTemplate === 'tech'
                        ? 'Tecnología y Electrónica'
                        : createTemplate === 'accessories'
                          ? 'Accesorios y Bolsos'
                          : 'General'}
                </strong>
              </span>
            </div>
            <div className="uv-crud-grid-2">
              <label className="uv-crud-field">
                <span>Nombre del producto</span>
                <input
                  required
                  maxLength={120}
                  placeholder="Ej. Camiseta Oficial Univalle 2026"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                />
              </label>
              <label className="uv-crud-field">
                <span>Categoría</span>
                <select
                  required
                  value={effectiveCategoryId}
                  onChange={(event) => {
                    const nextId = event.target.value
                    setProductCategory(nextId)
                    const nextCat = activeCategories.find((c) => c.id === nextId)
                    const nextTpl = detectCategoryTemplate(nextCat?.name ?? '')
                    if (nextTpl === 'clothing') {
                      setNewSizes(['S', 'M', 'L', 'XL'])
                    } else if (nextTpl === 'accessories') {
                      setNewSizes(['Única'])
                    } else {
                      setNewSizes([])
                    }
                  }}
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

            {/* Dynamic Category Options */}
            {(createTemplate === 'clothing' ||
              createTemplate === 'accessories') && (
              <div className="uv-crud-dynamic-box">
                <span className="uv-crud-dynamic-title">
                  {createTemplate === 'clothing'
                    ? 'Tallas disponibles para esta prenda (selecciona las que tengas en stock):'
                    : 'Medidas / Presentación del accesorio:'}
                </span>
                <div className="uv-size-chips-row">
                  {(createTemplate === 'clothing'
                    ? CLOTHING_SIZES
                    : ACCESSORY_SIZES
                  ).map((sz) => {
                    const isSelected = newSizes.includes(sz)
                    return (
                      <button
                        key={sz}
                        type="button"
                        className={`uv-size-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleNewSize(sz)}
                      >
                        {sz}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="uv-crud-grid-2">
              <label className="uv-crud-field">
                <span>
                  {createTemplate === 'clothing'
                    ? 'Material / Tela'
                    : createTemplate === 'books'
                      ? 'Autor / Editorial'
                      : createTemplate === 'tech'
                        ? 'Marca / Modelo'
                        : 'Material / Especificación'}
                </span>
                <input
                  maxLength={100}
                  placeholder={
                    createTemplate === 'clothing'
                      ? 'Ej. Algodón Perchado 100%'
                      : createTemplate === 'books'
                        ? 'Ej. Editorial Universidad del Valle'
                        : createTemplate === 'tech'
                          ? 'Ej. Logitech / Edición Campus'
                          : 'Ej. Acero Inoxidable / Lona'
                  }
                  value={newAttrPrimary}
                  onChange={(e) => setNewAttrPrimary(e.target.value)}
                />
              </label>
              <label className="uv-crud-field">
                <span>
                  {createTemplate === 'clothing'
                    ? 'Color / Corte'
                    : createTemplate === 'books'
                      ? 'Edición / Estado'
                      : createTemplate === 'tech'
                        ? 'Garantía / Estado'
                        : 'Condición / Detalle'}
                </span>
                <input
                  maxLength={100}
                  placeholder={
                    createTemplate === 'clothing'
                      ? 'Ej. Rojo Institucional · Unisex'
                      : createTemplate === 'books'
                        ? 'Ej. Edición 2026 · Nuevo'
                        : createTemplate === 'tech'
                          ? 'Ej. Nuevo · Garantía 6 meses'
                          : 'Ej. Edición 75 Años UV'
                  }
                  value={newAttrSecondary}
                  onChange={(e) => setNewAttrSecondary(e.target.value)}
                />
              </label>
            </div>

            <label className="uv-crud-field">
              <span>Descripción detallada del producto</span>
              <textarea
                maxLength={800}
                rows={2}
                placeholder="Describe características, recomendaciones de uso o información de entrega..."
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
                <span>Existencias (Stock en inventario)</span>
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
            <span>Actualiza precios, stock, tallas, atributos o estado</span>
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
