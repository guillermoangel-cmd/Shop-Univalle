import { useState } from 'react'
import CatalogPage from './pages/catalogo/CatalogPage'
import LoginPage from './pages/login/LoginPage'

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  return accessToken ? (
    <CatalogPage onLogout={() => setAccessToken(null)} />
  ) : (
    <LoginPage onAuthenticated={setAccessToken} />
  )
}

export default App