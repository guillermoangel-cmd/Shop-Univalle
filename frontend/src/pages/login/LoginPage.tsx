import { useState, type FormEvent } from 'react'
import UnivalleFooter from '../../components/footer/UnivalleFooter'
import './LoginPage.css'

const institutionalEmailPattern = /^[a-zA-Z0-9._%+-]+@correounivalle\.edu\.co$/i

interface LoginPageProps {
  onAuthenticated: (
    accessToken: string,
    user: NonNullable<AuthResponse['user']>,
  ) => void
}

interface AuthResponse {
  accessToken?: string
  message?: string | string[]
  user?: {
    id?: string
    name?: string
    email?: string
    role?: string
  }
}

function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [status, setStatus] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'activate'>('login')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [statusTone, setStatusTone] = useState<'error' | 'success'>('error')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim()
    const nextEmailError = institutionalEmailPattern.test(normalizedEmail)
      ? ''
      : 'Ingresa tu correo institucional usuario@correounivalle.edu.co.'
    const nextPasswordError = !password
      ? 'Ingresa tu contraseña.'
      : mode === 'activate' && password.length < 8
        ? 'Usa al menos 8 caracteres.'
        : ''
    const nextConfirmPasswordError =
      mode === 'activate' && password !== confirmPassword
        ? 'Las contraseñas no coinciden.'
        : ''

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setConfirmPasswordError(nextConfirmPasswordError)
    setStatus('')

    if (nextEmailError || nextPasswordError || nextConfirmPasswordError) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        mode === 'login' ? '/api/users/login' : '/api/users/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        },
      )
      const result = (await response.json()) as AuthResponse

      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message.join(' ')
          : result.message
        setStatus(message || 'No se pudo completar la solicitud.')
        setStatusTone('error')
        return
      }

      if (mode === 'activate') {
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        setStatus('Cuenta activada exitosamente. Ahora puedes iniciar sesión.')
        setStatusTone('success')
        return
      }

      if (!result.accessToken || !result.user?.role || !result.user.id) {
        setStatus('El servicio respondió sin una sesión válida.')
        setStatusTone('error')
        return
      }

      onAuthenticated(result.accessToken, result.user)
    } catch {
      setStatus('No se pudo conectar con el servicio de usuarios.')
      setStatusTone('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    setEmailError('')
    setStatus('')
    setStatusTone('error')
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    setPasswordError('')
    setStatus('')
    setStatusTone('error')
  }

  function switchMode(nextMode: 'login' | 'activate') {
    setMode(nextMode)
    setStatus('')
    setEmailError('')
    setPasswordError('')
    setConfirmPasswordError('')
  }

  return (
    <div className="uv-login-shell">
      {/* Top Institutional Header */}
      <header className="uv-login-topbar">
        <div className="uv-login-brand-bar">
          <img
            src="/assets/univalle-logo.png"
            alt="Logo Universidad del Valle"
            className="uv-login-logo-img"
          />
          <span className="uv-login-brand-title">TIENDA UNIVALLE</span>
        </div>

        <div className="uv-login-topbar-right">
          <span className="uv-login-campus-badge">
            PORTAL COMUNIDAD UNIVERSITARIA
          </span>
        </div>
      </header>

      <main className="uv-login-main">
        <div className="uv-login-card-layout">
          {/* Left Institutional Showcase Panel */}
          <aside className="uv-login-showcase" aria-hidden="true">
            <div className="uv-login-showcase-top">
              <span className="uv-login-kicker">TIENDA OFICIAL · EST. 1945</span>
              <h2>
                Talento, identidad y comercio universitario en un solo lugar.
              </h2>
              <p>
                Explora productos oficiales, publicaciones académicas y
                emprendimientos de estudiantes, docentes y administrativos de la
                Universidad del Valle.
              </p>
            </div>

            <div className="uv-login-showcase-Bottom">
              <div className="uv-login-feature-item">
                <span className="uv-login-feature-dot" />
                <div>
                  <strong>Exclusivo @correounivalle.edu.co</strong>
                  <span>Acceso verificado por rol institucional</span>
                </div>
              </div>
              <div className="uv-login-feature-item">
                <span className="uv-login-feature-dot" />
                <div>
                  <strong>Tiendas & Catálogo Integrado</strong>
                  <span>Compra o gestiona tus propios productos</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Form Panel */}
          <section className="uv-login-panel" aria-labelledby="login-title">
            <div className="uv-login-panel-header">
              <div className="uv-login-seal-row">
                <img
                  src="/assets/univalle-logo.png"
                  alt=""
                  className="uv-login-panel-logo"
                />
                <div>
                  <p className="uv-login-eyebrow">UNIVERSIDAD DEL VALLE</p>
                  <h1 id="login-title">
                    {mode === 'login' ? 'Inicia sesión' : 'Activa tu cuenta'}
                  </h1>
                </div>
              </div>

              <p className="uv-login-subtitle">
                {mode === 'login'
                  ? 'Ingresa con tus credenciales institucionales para acceder al catálogo.'
                  : 'Configura tu contraseña por primera vez con tu correo institucional autorizado.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="uv-login-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={`uv-login-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'activate'}
                className={`uv-login-tab ${mode === 'activate' ? 'active' : ''}`}
                onClick={() => switchMode('activate')}
              >
                Activar Cuenta
              </button>
            </div>

            <form className="uv-login-form" onSubmit={handleSubmit} noValidate>
              <div className="uv-login-field">
                <label htmlFor="login-email">CORREO INSTITUCIONAL</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => handleEmailChange(event.target.value)}
                  placeholder="usuario@correounivalle.edu.co"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={
                    emailError ? 'login-email-error' : 'login-email-hint'
                  }
                />
                {emailError ? (
                  <span
                    className="uv-login-field-error"
                    id="login-email-error"
                    role="alert"
                  >
                    {emailError}
                  </span>
                ) : (
                  <span className="uv-login-field-hint" id="login-email-hint">
                    Usa tu cuenta terminada en @correounivalle.edu.co
                  </span>
                )}
              </div>

              <div className="uv-login-field">
                <label htmlFor="login-password">CONTRASEÑA</label>
                <div className="uv-login-password-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(event) =>
                      handlePasswordChange(event.target.value)
                    }
                    placeholder="••••••••"
                    autoComplete={
                      mode === 'login' ? 'current-password' : 'new-password'
                    }
                    minLength={mode === 'activate' ? 8 : undefined}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={
                      passwordError ? 'login-password-error' : undefined
                    }
                  />
                  <button
                    className="uv-login-password-toggle"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                  </button>
                </div>
                {passwordError && (
                  <span
                    className="uv-login-field-error"
                    id="login-password-error"
                    role="alert"
                  >
                    {passwordError}
                  </span>
                )}
              </div>

              {mode === 'activate' && (
                <div className="uv-login-field">
                  <label htmlFor="login-confirm-password">
                    CONFIRMAR CONTRASEÑA
                  </label>
                  <input
                    id="login-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    placeholder="Repite tu contraseña (mín. 8 caracteres)"
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setConfirmPasswordError('')
                    }}
                    autoComplete="new-password"
                    aria-invalid={Boolean(confirmPasswordError)}
                    aria-describedby={
                      confirmPasswordError
                        ? 'login-confirm-password-error'
                        : undefined
                    }
                  />
                  {confirmPasswordError && (
                    <span
                      className="uv-login-field-error"
                      id="login-confirm-password-error"
                      role="alert"
                    >
                      {confirmPasswordError}
                    </span>
                  )}
                </div>
              )}

              <button
                className="uv-login-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'PROCESANDO...'
                  : mode === 'login'
                    ? 'INGRESAR A TIENDA UNIVALLE →'
                    : 'ACTIVAR MI CUENTA INSTITUCIONAL →'}
              </button>

              {status && (
                <p
                  className={`uv-login-status uv-login-status--${statusTone}`}
                  role={statusTone === 'error' ? 'alert' : 'status'}
                >
                  {status}
                </p>
              )}
            </form>

            <div className="uv-login-bottom-switch">
              <span>
                {mode === 'login'
                  ? '¿Es tu primera vez en la plataforma?'
                  : '¿Ya activaste tu cuenta institucional?'}
              </span>
              <button
                className="uv-login-mode-switch"
                type="button"
                onClick={() =>
                  switchMode(mode === 'login' ? 'activate' : 'login')
                }
              >
                {mode === 'login'
                  ? 'Activa tu cuenta aquí'
                  : 'Volver a iniciar sesión'}
              </button>
            </div>
          </section>
        </div>
      </main>

      <UnivalleFooter />
    </div>
  )
}

export default LoginPage
