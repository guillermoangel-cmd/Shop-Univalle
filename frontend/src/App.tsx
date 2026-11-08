import { useEffect, useState } from 'react'
import CartPage from './pages/carrito/CartPage'
import CatalogPage from './pages/catalogo/CatalogPage'
import LoginPage from './pages/login/LoginPage'
import {
  DEFAULT_UNIVALLE_PRODUCTS,
  addProductToCart,
  applyCartPromoCode,
  checkoutCartOrder,
  clearAllCart,
  fetchCart,
  removeCartItem,
  updateCartItemState,
} from './services/ordersApi'
import type { CartState } from './types/cart'
import type { Product } from './types/product'

type ViewMode = 'login' | 'catalog' | 'cart'

const TOKEN_STORAGE_KEY = 'univalle_shop_token'

function getInitialView(hasToken: boolean): ViewMode {
  if (typeof window !== 'undefined' && window.location.pathname === '/cart') {
    return 'cart'
  }
  return hasToken ? 'catalog' : 'login'
}

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY)
    } catch {
      return null
    }
  })

  const [view, setView] = useState<ViewMode>(() =>
    getInitialView(Boolean(accessToken)),
  )

  const [cart, setCart] = useState<CartState>({
    id: null,
    userId: 'estudiante-univalle',
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
  })

  const userId = 'estudiante-univalle'

  useEffect(() => {
    void fetchCart(userId).then(setCart)
  }, [userId])

  const navigateTo = (nextView: ViewMode) => {
    setView(nextView)
    if (typeof window !== 'undefined') {
      const nextPath = nextView === 'cart' ? '/cart' : '/'
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }
    }
  }

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === '/cart') {
        setView('cart')
      } else {
        setView(accessToken ? 'catalog' : 'login')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [accessToken])

  const handleAuthenticated = (token: string) => {
    setAccessToken(token)
    try {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
    } catch {
      // ignore
    }
    navigateTo('catalog')
  }

  const handleLogout = () => {
    setAccessToken(null)
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    } catch {
      // ignore
    }
    navigateTo('login')
  }

  const handleAddProduct = async (product: Product) => {
    const updated = await addProductToCart(userId, product, 1)
    setCart(updated)
  }

  const handleLoadReferenceItems = async () => {
    await clearAllCart(userId)
    await addProductToCart(userId, DEFAULT_UNIVALLE_PRODUCTS[0], 1) // Camiseta $45.000 x 1
    await addProductToCart(userId, DEFAULT_UNIVALLE_PRODUCTS[1], 2) // Agenda $28.000 x 2 = $56.000
    await addProductToCart(userId, DEFAULT_UNIVALLE_PRODUCTS[2], 1) // Taza $18.000 x 1
    const updated = await addProductToCart(
      userId,
      DEFAULT_UNIVALLE_PRODUCTS[3],
      1,
    ) // Maletín $120.000 x 1
    setCart(updated)
  }

  if (view === 'cart') {
    return (
      <CartPage
        cart={cart}
        isAuthenticated={Boolean(accessToken)}
        onBackToCatalog={() => navigateTo(accessToken ? 'catalog' : 'login')}
        onGoToLogin={() => navigateTo('login')}
        onLogout={handleLogout}
        onUpdateQuantity={async (productId, quantity) => {
          const updated = await updateCartItemState(userId, productId, {
            quantity,
          })
          setCart(updated)
        }}
        onToggleSelected={async (productId, selected) => {
          const updated = await updateCartItemState(userId, productId, {
            selected,
          })
          setCart(updated)
        }}
        onToggleFavorite={async (productId, favorite) => {
          const updated = await updateCartItemState(userId, productId, {
            favorite,
          })
          setCart(updated)
        }}
        onRemoveItem={async (productId) => {
          const updated = await removeCartItem(userId, productId)
          setCart(updated)
        }}
        onClearAll={async () => {
          const updated = await clearAllCart(userId)
          setCart(updated)
        }}
        onApplyPromo={async (code) => {
          const updated = await applyCartPromoCode(userId, code)
          setCart(updated)
        }}
        onCheckout={async (mode) => {
          const result = await checkoutCartOrder(userId, mode)
          setCart(result.cart)
          return result.order
        }}
        onLoadReferenceItems={handleLoadReferenceItems}
      />
    )
  }

  if (!accessToken) {
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  return (
    <CatalogPage
      bagCount={cart.summary.totalItems}
      onOpenCart={() => navigateTo('cart')}
      onAddProduct={handleAddProduct}
      onLogout={handleLogout}
    />
  )
}

export default App
