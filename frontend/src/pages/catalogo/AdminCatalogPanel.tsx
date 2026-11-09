import { useEffect, useState, type FormEvent } from 'react'
import type { Product } from '../../types/product'
import { deleteProductImage, uploadProductImage } from '../../services/uploadsApi'

const DEFAULT_PRODUCT_IMAGE = '/assets/default_products/producto_default.webp'
const isUploadedProductImage = (imageUrl: string) =>
  imageUrl.startsWith('/uploads/assets/user_productos_img/')

export interface CatalogCategory {
  id: string
  name: string
  description: string
  active: boolean
}

interface AdminCatalogPanelProps {
  accessToken: string
  categories: CatalogCategory[]
  onChanged: () => void
}

async function adminRequest(
  path: string,
  accessToken: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: Record<string, string | number>,
) {
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const result = await response.json() as { message?: string | string[] }
    throw new Error(Array.isArray(result.message)
      ? result.message.join(' ')
      : result.message || 'No se pudo completar la operación.')
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

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    onError('')
    try {
      await adminRequest(`/api/categories/${encodeURIComponent(category.id)}`, accessToken, 'PATCH', {
        name: name.trim(),
        description: description.trim(),
      })
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo actualizar la categoría.')
    } finally {
      setSaving(false)
    }
  }

  async function deactivate() {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return
    onError('')
    try {
      await adminRequest(`/api/categories/${encodeURIComponent(category.id)}`, accessToken, 'DELETE')
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo eliminar la categoría.')
    }
  }

  return (
    <form className="admin-category-row" onSubmit={save}>
      <label>
        <span>Nombre</span>
        <input required maxLength={80} disabled={!category.active} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        <span>Descripción</span>
        <input maxLength={240} disabled={!category.active} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <div className="admin-row-actions">
        {category.active && <button className="admin-secondary-button" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>}
        {category.active ? (
          <button className="admin-danger-button" type="button" onClick={deactivate}>Eliminar</button>
        ) : (
          <button
            className="admin-secondary-button"
            type="button"
            onClick={async () => {
              onError('')
              try {
                await adminRequest(`/api/categories/${encodeURIComponent(category.id)}/activate`, accessToken, 'PATCH')
                onChanged()
              } catch (error) {
                onError(error instanceof Error ? error.message : 'No se pudo reactivar la categoría.')
              }
            }}
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
  const [imageUrl, setImageUrl] = useState(product.imageUrl || DEFAULT_PRODUCT_IMAGE)
  const [categoryId, setCategoryId] = useState(product.categoryId || '')
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    onError('')
    try {
      const savedImageUrl = imageFile
        ? await uploadProductImage(accessToken, imageFile)
        : imageUrl.trim() || DEFAULT_PRODUCT_IMAGE
      await adminRequest(`/api/products/${encodeURIComponent(product.id)}`, accessToken, 'PATCH', {
        name: name.trim(),
        description: description.trim(),
        imageUrl: savedImageUrl,
        categoryId,
        price: Number(price),
        stock: Number(stock),
      })
      onChanged()
      if (product.imageUrl && isUploadedProductImage(product.imageUrl) && product.imageUrl !== savedImageUrl) {
        const deleted = await deleteProductImage(accessToken, product.id, product.imageUrl)
        if (!deleted) onError('El producto se guardó; la imagen anterior se conserva porque aún está en uso.')
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo actualizar el producto.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm(`¿Eliminar el producto "${product.name}" del catálogo?`)) return
    setSaving(true)
    onError('')
    try {
      if (product.imageUrl && isUploadedProductImage(product.imageUrl)) {
        await adminRequest(`/api/products/${encodeURIComponent(product.id)}`, accessToken, 'PATCH', {
          imageUrl: DEFAULT_PRODUCT_IMAGE,
        })
        onChanged()
        const deleted = await deleteProductImage(accessToken, product.id, product.imageUrl)
        if (!deleted) onError('El producto se eliminará; la imagen se conserva porque aún está en uso.')
      }
      await adminRequest(`/api/products/${encodeURIComponent(product.id)}`, accessToken, 'DELETE')
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo eliminar el producto.')
    } finally {
      setSaving(false)
    }
  }

  async function restore() {
    setSaving(true)
    onError('')
    try {
      await adminRequest(`/api/products/${encodeURIComponent(product.id)}/restore`, accessToken, 'PATCH')
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo reactivar el producto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-product-row" onSubmit={(event) => void save(event)}>
      <img
        src={imageUrl}
        alt=""
        onError={(event) => {
          if (event.currentTarget.src !== new URL(DEFAULT_PRODUCT_IMAGE, window.location.href).href) {
            event.currentTarget.src = DEFAULT_PRODUCT_IMAGE
          }
        }}
      />
      <label>
        <span>Nombre</span>
        <input required maxLength={120} disabled={!product.active || saving} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        <span>Descripción</span>
        <input maxLength={1000} disabled={!product.active || saving} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        <span>URL de imagen</span>
        <input disabled={!product.active || saving || Boolean(imageFile)} value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
      </label>
      <label>
        <span>Subir imagen</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={!product.active || saving}
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="admin-form-row">
        <label>
          <span>Categoría</span>
          <select required disabled={!product.active || saving} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Selecciona</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label>
          <span>Precio (COP)</span>
          <input required type="number" min="1" step="1" disabled={!product.active || saving} value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
        <label>
          <span>Existencias</span>
          <input required type="number" min="0" step="1" disabled={!product.active || saving} value={stock} onChange={(event) => setStock(event.target.value)} />
        </label>
      </div>
      <div className="admin-row-actions">
        {product.active ? (
          <>
            <button className="admin-secondary-button" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
            <button
              className="admin-secondary-button"
              type="button"
              disabled={saving || imageUrl === DEFAULT_PRODUCT_IMAGE && !imageFile}
              onClick={() => {
                setImageUrl(DEFAULT_PRODUCT_IMAGE)
                setImageFile(null)
              }}
            >
              Imagen predeterminada
            </button>
            <button className="admin-danger-button" type="button" disabled={saving} onClick={() => void remove()}>Eliminar</button>
          </>
        ) : (
          <>
            <span className="admin-hint">Producto eliminado</span>
            <button className="admin-secondary-button" type="button" disabled={saving} onClick={() => void restore()}>Reactivar</button>
          </>
        )}
      </div>
    </form>
  )
}

function AdminCatalogPanel({ accessToken, categories, onChanged }: AdminCatalogPanelProps) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productImage, setProductImage] = useState('')
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productCategory, setProductCategory] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productStock, setProductStock] = useState('')
  const [managedCategories, setManagedCategories] = useState<CatalogCategory[]>([])
  const [managedProducts, setManagedProducts] = useState<Product[]>([])
  const [categoryLoadError, setCategoryLoadError] = useState('')
  const [productLoadError, setProductLoadError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function refreshManagedCategories() {
    try {
      const response = await fetch('/api/categories/manage', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        const result = await response.json() as { message?: string }
        throw new Error(result.message || 'No se pudieron consultar las categorías.')
      }
      const result = await response.json() as unknown
      if (!Array.isArray(result)) throw new Error('La respuesta de categorías no es válida.')
      setManagedCategories(result as CatalogCategory[])
      setCategoryLoadError('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron consultar las categorías.'
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
        const result = await response.json() as { message?: string }
        throw new Error(result.message || 'No se pudieron consultar los productos.')
      }
      const result = await response.json() as unknown
      if (!Array.isArray(result)) throw new Error('La respuesta de productos no es válida.')
      setManagedProducts(result as Product[])
      setProductLoadError('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron consultar los productos.'
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
        if (!categoryResponse.ok) throw new Error('No se pudieron consultar las categorías.')
        if (!productResponse.ok) throw new Error('No se pudieron consultar los productos.')
        if (!Array.isArray(categoryData)) throw new Error('La respuesta de categorías no es válida.')
        if (!Array.isArray(productData)) throw new Error('La respuesta de productos no es válida.')
        if (active) {
          setManagedCategories(categoryData as CatalogCategory[])
          setManagedProducts(productData as Product[])
          setCategoryLoadError('')
          setProductLoadError('')
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        const errorMessage = error instanceof Error ? error.message : 'No se pudo cargar el catálogo de gestión.'
        setCategoryLoadError(errorMessage)
        setProductLoadError(errorMessage)
        setMessage(errorMessage)
      })
    return () => {
      active = false
    }
  }, [accessToken])

  function refreshAfterCategoryChange() {
    onChanged()
    void refreshManagedCategories()
    void refreshManagedProducts()
  }

  function refreshAfterProductChange() {
    onChanged()
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
      setMessage('Categoría creada.')
      refreshAfterCategoryChange()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la categoría.')
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
          categoryId: productCategory,
          price: Number(productPrice),
          stock: Number(productStock),
        }),
      })
      if (!response.ok) {
        const result = await response.json() as { message?: string | string[] }
        throw new Error(Array.isArray(result.message)
          ? result.message.join(' ')
          : result.message || 'No se pudo publicar el producto.')
      }
      setProductName('')
      setProductDescription('')
      setProductImage('')
      setProductImageFile(null)
      setProductPrice('')
      setProductStock('')
      setMessage('Producto publicado en el catálogo.')
      onChanged()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo publicar el producto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-catalog-panel" aria-labelledby="admin-catalog-title">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Mi perfil de tienda</p>
          <h2 id="admin-catalog-title">Gestionar mis productos y categorías</h2>
        </div>
        <span>Solo puedes gestionar los datos de tu tienda</span>
      </div>

      <div className="admin-panel-grid">
        <form className="admin-form" onSubmit={createCategory}>
          <h3>Nueva categoría</h3>
          <label>
            <span>Nombre</span>
            <input
              required
              maxLength={80}
              placeholder="Ej. Bebidas"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
            />
          </label>
          <label>
            <span>Descripción</span>
            <input
              maxLength={240}
              placeholder="Descripción opcional"
              value={categoryDescription}
              onChange={(event) => setCategoryDescription(event.target.value)}
            />
          </label>
          <button className="admin-primary-button" type="submit" disabled={saving}>
            Crear categoría
          </button>
        </form>

        <form className="admin-form" onSubmit={createProduct}>
          <h3>Publicar producto</h3>
          <label>
            <span>Nombre</span>
            <input required maxLength={120} value={productName} onChange={(event) => setProductName(event.target.value)} />
          </label>
          <label>
            <span>Descripción</span>
            <textarea maxLength={1000} rows={3} value={productDescription} onChange={(event) => setProductDescription(event.target.value)} />
          </label>
          <label>
            <span>URL de imagen (opcional)</span>
            <input type="url" placeholder="https://…" disabled={Boolean(productImageFile)} value={productImage} onChange={(event) => setProductImage(event.target.value)} />
          </label>
          <label>
            <span>O subir imagen (PNG, JPEG o WebP; máximo 5 MB)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setProductImageFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="admin-form-row">
            <label>
              <span>Categoría</span>
              <select required value={productCategory} onChange={(event) => setProductCategory(event.target.value)}>
                <option value="">Selecciona</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Precio (COP)</span>
              <input required type="number" min="1" step="1" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} />
            </label>
            <label>
              <span>Existencias</span>
              <input required type="number" min="0" step="1" value={productStock} onChange={(event) => setProductStock(event.target.value)} />
            </label>
          </div>
          <button className="admin-primary-button" type="submit" disabled={saving || categories.length === 0}>
            {saving ? 'Publicando…' : 'Publicar producto'}
          </button>
          {categories.length === 0 && <p className="admin-hint">Crea una categoría antes de publicar productos.</p>}
        </form>
      </div>

      <div className="admin-category-list">
        <h3>Gestionar categorías</h3>
        {categoryLoadError ? (
          <p className="admin-hint" role="alert">{categoryLoadError}</p>
        ) : managedCategories.length === 0 ? (
          <p className="admin-hint">Aún no hay categorías.</p>
        ) : managedCategories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            accessToken={accessToken}
            onChanged={refreshAfterCategoryChange}
            onError={setMessage}
          />
        ))}
      </div>
      <div className="admin-product-list">
        <h3>Mis productos</h3>
        {productLoadError ? (
          <p className="admin-hint" role="alert">{productLoadError}</p>
        ) : managedProducts.length === 0 ? (
          <p className="admin-hint">Aún no has publicado productos.</p>
        ) : managedProducts.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            categories={managedCategories.filter((item) => item.active)}
            accessToken={accessToken}
            onChanged={refreshAfterProductChange}
            onError={setMessage}
          />
        ))}
      </div>
      {message && <p className="admin-feedback" role="status">{message}</p>}
    </section>
  )
}

export default AdminCatalogPanel
