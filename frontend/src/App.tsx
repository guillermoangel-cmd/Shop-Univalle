import { useState } from 'react'
import CatalogPage from './pages/catalogo/CatalogPage'
import LoginPage from './pages/login/LoginPage'

interface Session {
  accessToken: string
  role: string
}

function App() {
  const [session, setSession] = useState<Session | null>(null)

  return session ? (
    <CatalogPage
      accessToken={session.accessToken}
      role={session.role}
      onLogout={() => setSession(null)}
    />
  ) : (
    <LoginPage onAuthenticated={(accessToken, role) => setSession({ accessToken, role })} />
  )
}

export default App