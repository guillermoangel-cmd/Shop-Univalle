import { useEffect, useState } from 'react'
import CartPage from './pages/carrito/CartPage'
import CatalogPage from './pages/catalogo/CatalogPage'
import ModerationPage from './pages/catalogo/ModerationPage'
import ProfilePage from './pages/perfil/ProfilePage'
import LoginPage from './pages/login/LoginPage'
import {
  addProductToCart,
  applyCartPromoCode,
  checkoutCartOrder,
  clearAllCart,
  fetchCart,
  removeCartItem,
  updateCartItemState,
} from './services/ordersApi'
import { listStoreProfiles, type StoreProfile } from './services/usersApi'
import type { CartState } from './types/cart'
import type { Product } from './types/product'

interface Session {
  accessToken: string
  id: string
  name: string
  email: string
  role: string
}

type ViewMode = 'login' | 'catalog' | 'shop' | 'cart' | 'profile' | 'moderation'

const SESSION_STORAGE_KEY = 'univalle_shop_session'
const EMPTY_CART: CartState = {
  id: null,
  userId: '',
  storeProfileId: 'default-store',
  items: [],
  summary: {
    distinctItemsCount: 0,
    totalItems: 0,
    subtotal: 0,
    discountAmount: 0,
    estimatedShipping: 0,
    taxRate: 0.19,
    taxes: 0,
    totalFinal: 0,
    promoCode: null,
  },
}

function getSavedSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Partial<Session>
    return saved.accessToken && saved.id && saved.role
      ? {
          accessToken: saved.accessToken,
          id: saved.id,
          name: saved.name || 'Usuario',
          email: saved.email || '',
          role: saved.role,
        }
      : null
  } catch {
    return null
  }
}

function readLocation(): { view: ViewMode; profileId: string | null } {
  if (typeof window === 'undefined') return { view: 'login', profileId: null }
  const path = window.location.pathname
  if (path === '/cart') return { view: 'cart', profileId: null }
  if (path === '/profile') return { view: 'profile', profileId: null }
  if (path === '/moderation') return { view: 'moderation', profileId: null }
  const shop = path.match(/^\/shop\/([^/]+)$/)
  if (shop) return { view: 'shop', profileId: decodeURIComponent(shop[1]) }
  return { view: 'catalog', profileId: null }
}

function App() {
  const [session, setSession] = useState<Session | null>(getSavedSession)
  const [location, setLocation] = useState(readLocation)
  const [view, setView] = useState<ViewMode>(() =>
    session ? location.view : 'login',
  )
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    location.profileId,
  )
  const [stores, setStores] = useState<StoreProfile[]>([])
  const [cart, setCart] = useState<CartState>(EMPTY_CART)
  const [cartError, setCartError] = useState('')

  const userId = session?.id ?? 'guest-user'
  const selectedStore = stores.find((store) => store.id === selectedStoreId)
  const storeId = selectedStoreId ?? 'default-store'
  const shippingCost = selectedStore?.shippingCost ?? 8000
  const cartForSelectedStore =
    selectedStoreId &&
    cart.userId === userId &&
    cart.storeProfileId === selectedStoreId
      ? cart
      : { ...EMPTY_CART, userId, storeProfileId: selectedStoreId ?? '' }
  const displayedCartError =
    session && view === 'cart' && !selectedStoreId
      ? 'Selecciona una tienda para consultar su carrito.'
      : cartError

  useEffect(() => {
    let active = true
    void listStoreProfiles()
      .then((items) => {
        if (active) setStores(items)
      })
      .catch(() => {
        if (active) setStores([])
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!session || !selectedStoreId) {
      return
    }
    let active = true
    void fetchCart(userId, storeId, shippingCost, session.accessToken)
      .then((current) => {
        if (active) {
          setCart(current)
          setCartError('')
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setCart({ ...EMPTY_CART, userId, storeProfileId: storeId })
          setCartError(cause instanceof Error ? cause.message : 'No se pudo cargar el carrito.')
        }
      })
    return () => {
      active = false
    }
  }, [session, userId, storeId, shippingCost, selectedStoreId, view])

  const navigateTo = (nextView: ViewMode, profileId: string | null = null) => {
    setView(nextView)
    if (nextView === 'catalog') setSelectedStoreId(null)
    else if (nextView === 'shop') setSelectedStoreId(profileId)
    if (typeof window !== 'undefined') {
      const nextPath =
        nextView === 'cart'
          ? '/cart'
          : nextView === 'profile'
            ? '/profile'
            : nextView === 'moderation'
              ? '/moderation'
              : nextView === 'shop' && profileId
                ? `/shop/${encodeURIComponent(profileId)}`
                : '/'
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }
    }
  }

  useEffect(() => {
    const onPopState = () => {
      const next = readLocation()
      setLocation(next)
      setView(session ? next.view : 'login')
      setSelectedStoreId(next.profileId)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [session])

  const handleAuthenticated = (
    accessToken: string,
    user: { id?: string; name?: string; email?: string; role?: string },
  ) => {
    const nextSession = {
      accessToken,
      id: user.id ?? '',
      name: user.name ?? 'Usuario',
      email: user.email ?? '',
      role: user.role ?? 'ESTUDIANTE',
    }
    setSession(nextSession)
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    } catch {
      // Session storage is optional; the authenticated state remains in memory.
    }
    navigateTo('catalog')
  }

  const handleLogout = () => {
    setSession(null)
    setSelectedStoreId(null)
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // Session storage is optional.
    }
    navigateTo('login')
  }

  const handleAddProduct = async (product: Product) => {
    if (!session) return
    const store = stores.find((item) => item.id === product.profileId)
    const updated = await addProductToCart(
      userId,
      {
        ...product,
        shippingCost: store?.shippingCost ?? shippingCost,
      },
      1,
      session.accessToken,
    )
    setCart(updated)
  }

  const runCartAction = async (operation: Promise<CartState>) => {
    setCartError('')
    try {
      setCart(await operation)
    } catch (cause) {
      setCartError(cause instanceof Error ? cause.message : 'No se pudo actualizar el carrito.')
    }
  }

  if (view === 'cart') {
    return (
      <CartPage
        cart={cartForSelectedStore}
        cartError={displayedCartError}
        isAuthenticated={Boolean(session)}
        accessToken={session?.accessToken ?? ''}
        onBackToCatalog={() => navigateTo('catalog')}
        onOpenProfile={() => navigateTo('profile')}
        onGoToLogin={() => navigateTo('login')}
        onLogout={handleLogout}
        onUpdateQuantity={async (productId, quantity) => {
          if (!session) return
          await runCartAction(updateCartItemState(
            userId, productId, { quantity }, storeId, shippingCost, session.accessToken,
          ))
        }}
        onToggleSelected={async (productId, selected) => {
          if (!session) return
          await runCartAction(updateCartItemState(
            userId, productId, { selected }, storeId, shippingCost, session.accessToken,
          ))
        }}
        onToggleFavorite={async (productId, favorite) => {
          if (!session) return
          await runCartAction(updateCartItemState(
            userId, productId, { favorite }, storeId, shippingCost, session.accessToken,
          ))
        }}
        onRemoveItem={async (productId) => {
          if (!session) return
          await runCartAction(removeCartItem(
            userId, productId, storeId, shippingCost, session.accessToken,
          ))
        }}
        onClearAll={async () => {
          if (!session) return
          await runCartAction(clearAllCart(userId, storeId, shippingCost, session.accessToken))
        }}
        onApplyPromo={async (code) => {
          if (!session) return
          setCart(await applyCartPromoCode(
            userId, code, storeId, shippingCost, session.accessToken,
          ))
        }}
        onCheckout={async (mode, address) => {
          if (!session) return null
          const result = await checkoutCartOrder(
            userId, mode, storeId, shippingCost, address, session.accessToken,
          )
          setCart(result.cart)
          return result.order
        }}
      />
    )
  }

  if (!session) {
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  if (view === 'profile') {
    return (
      <ProfilePage
        accessToken={session.accessToken}
        onBack={() => navigateTo('catalog')}
        onLogout={handleLogout}
      />
    )
  }

  if (view === 'moderation' && session.role === 'ADMINISTRATIVO') {
    return (
      <ModerationPage
        accessToken={session.accessToken}
        onBack={() => navigateTo('catalog')}
      />
    )
  }

  return (
    <CatalogPage
      bagCount={cart.summary.totalItems}
      onOpenCart={() => navigateTo('cart')}
      onAddProduct={handleAddProduct}
      accessToken={session.accessToken}
      role={session.role}
      userId={session.id}
      userName={session.name}
      selectedStoreId={view === 'shop' ? selectedStoreId : null}
      onOpenProfile={() => navigateTo('profile')}
      onOpenStore={(profileId) =>
        profileId
          ? navigateTo('shop', profileId)
          : navigateTo('catalog')
      }
      onOpenModeration={() => navigateTo('moderation')}
      onLogout={handleLogout}
    />
  )
}

export default App
