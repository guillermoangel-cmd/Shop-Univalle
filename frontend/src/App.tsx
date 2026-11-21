import { useEffect, useState } from 'react'
import CartPage from './pages/carrito/CartPage'
import AdminCatalogPanel from './pages/catalogo/AdminCatalogPanel'
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
} from './api/ordersApi'
import { listStoreProfiles, type StoreProfile } from './api/usersApi'
import type { CartState } from './types/cart'
import type { Product } from './types/product'

interface Session {
  accessToken: string
  id: string
  name: string
  email: string
  role: string
}

type ViewMode =
  | 'login'
  | 'catalog'
  | 'shop'
  | 'cart'
  | 'profile'
  | 'history'
  | 'moderation'
  | 'manage'

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

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(window.atob(base64)) as { exp?: number }
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
      return true
    }
    return false
  } catch {
    return false
  }
}

function getSavedSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Partial<Session>
    if (!saved.accessToken || !saved.id || !saved.role) return null
    if (isJwtExpired(saved.accessToken)) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
    return {
      accessToken: saved.accessToken,
      id: saved.id,
      name: saved.name || 'Usuario',
      email: saved.email || '',
      role: saved.role,
    }
  } catch {
    return null
  }
}

function readLocation(): { view: ViewMode; profileId: string | null } {
  if (typeof window === 'undefined') return { view: 'login', profileId: null }
  const path = window.location.pathname
  if (path === '/cart') return { view: 'cart', profileId: null }
  if (path === '/profile') return { view: 'profile', profileId: null }
  if (path === '/history') return { view: 'history', profileId: null }
  if (path === '/moderation') return { view: 'moderation', profileId: null }
  if (path === '/manage') return { view: 'manage', profileId: null }
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
  const storeId = 'default-store'
  const shippingCost = selectedStore?.shippingCost ?? 8000
  const cartForSelectedStore =
    cart.userId === userId
      ? cart
      : { ...EMPTY_CART, userId, storeProfileId: storeId }
  const displayedCartError = cartError

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
    if (!session) {
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
          const msg =
            cause instanceof Error
              ? cause.message
              : 'No se pudo cargar el carrito.'
          if (
            msg.toLowerCase().includes('expir') ||
            msg.toLowerCase().includes('token inválido') ||
            msg.toLowerCase().includes('sesión válida')
          ) {
            handleLogout()
            return
          }
          setCart({ ...EMPTY_CART, userId, storeProfileId: storeId })
          setCartError(msg)
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
            : nextView === 'history'
              ? '/history'
              : nextView === 'moderation'
                ? '/moderation'
                : nextView === 'manage'
                  ? '/manage'
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

  const handleAddProduct = async (product: Product, quantity = 1) => {
    if (!session) return
    const targetStoreId = product.profileId || 'default-store'
    const store = stores.find((item) => item.id === targetStoreId)
    const updated = await addProductToCart(
      userId,
      {
        ...product,
        profileId: storeId,
        shippingCost: store?.shippingCost ?? shippingCost,
      },
      quantity,
      session.accessToken,
    )
    setCart(updated)
  }

  const runCartAction = async (operation: Promise<CartState>) => {
    setCartError('')
    try {
      setCart(await operation)
    } catch (cause) {
      setCartError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo actualizar el carrito.',
      )
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
          await runCartAction(
            updateCartItemState(
              userId,
              productId,
              { quantity },
              storeId,
              shippingCost,
              session.accessToken,
            ),
          )
        }}
        onToggleSelected={async (productId, selected) => {
          if (!session) return
          await runCartAction(
            updateCartItemState(
              userId,
              productId,
              { selected },
              storeId,
              shippingCost,
              session.accessToken,
            ),
          )
        }}
        onToggleFavorite={async (productId, favorite) => {
          if (!session) return
          await runCartAction(
            updateCartItemState(
              userId,
              productId,
              { favorite },
              storeId,
              shippingCost,
              session.accessToken,
            ),
          )
        }}
        onRemoveItem={async (productId) => {
          if (!session) return
          await runCartAction(
            removeCartItem(
              userId,
              productId,
              storeId,
              shippingCost,
              session.accessToken,
            ),
          )
        }}
        onClearAll={async () => {
          if (!session) return
          await runCartAction(
            clearAllCart(userId, storeId, shippingCost, session.accessToken),
          )
        }}
        onApplyPromo={async (code, dynamicShipping) => {
          if (!session) return
          setCart(
            await applyCartPromoCode(
              userId,
              code,
              storeId,
              dynamicShipping ?? shippingCost,
              session.accessToken,
            ),
          )
        }}
        onSyncShippingCost={async (dynamicShipping) => {
          if (!session) return
          await runCartAction(
            fetchCart(
              userId,
              storeId,
              dynamicShipping,
              session.accessToken,
            ),
          )
        }}
        onCheckout={async (mode, address, dynamicShipping) => {
          if (!session) return null
          const result = await checkoutCartOrder(
            userId,
            mode,
            storeId,
            dynamicShipping ?? shippingCost,
            address,
            session.accessToken,
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

  if (view === 'profile' || view === 'history') {
    return (
      <ProfilePage
        accessToken={session.accessToken}
        userId={session.id}
        userName={session.name}
        userEmail={session.email}
        role={session.role}
        bagCount={cart.summary.totalItems}
        initialTab={view === 'history' ? 'orders' : 'account'}
        onBack={() => navigateTo('catalog')}
        onOpenProfile={() => navigateTo('profile')}
        onOpenHistory={() => navigateTo('history')}
        onOpenCart={() => navigateTo('cart')}
        onOpenManage={() => navigateTo('manage')}
        onOpenModeration={() => navigateTo('moderation')}
        onLogout={handleLogout}
      />
    )
  }

  if (view === 'manage') {
    return (
      <AdminCatalogPanel
        accessToken={session.accessToken}
        userName={session.name}
        role={session.role}
        bagCount={cart.summary.totalItems}
        onBack={() => navigateTo('catalog')}
        onOpenProfile={() => navigateTo('profile')}
        onOpenHistory={() => navigateTo('history')}
        onOpenCart={() => navigateTo('cart')}
        onOpenModeration={() => navigateTo('moderation')}
        onLogout={handleLogout}
      />
    )
  }

  if (
    view === 'moderation' &&
    (session.role === 'ADMINISTRATIVO' || session.role === 'ADMINISTRADOR')
  ) {
    return (
      <ModerationPage
        accessToken={session.accessToken}
        userName={session.name}
        bagCount={cart.summary.totalItems}
        onBack={() => navigateTo('catalog')}
        onOpenProfile={() => navigateTo('profile')}
        onOpenHistory={() => navigateTo('history')}
        onOpenManage={() => navigateTo('manage')}
        onOpenCart={() => navigateTo('cart')}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <CatalogPage
      bagCount={cart.summary.totalItems}
      onOpenCart={() => navigateTo('cart')}
      onAddProduct={handleAddProduct}
      role={session.role}
      userId={session.id}
      userName={session.name}
      selectedStoreId={view === 'shop' ? selectedStoreId : null}
      onOpenProfile={() => navigateTo('profile')}
      onOpenHistory={() => navigateTo('history')}
      onOpenManage={() => navigateTo('manage')}
      onOpenStore={(profileId) =>
        profileId ? navigateTo('shop', profileId) : navigateTo('catalog')
      }
      onOpenModeration={() => navigateTo('moderation')}
      onLogout={handleLogout}
    />
  )
}

export default App
