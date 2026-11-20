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
        {/* Flowing Two-Column Hero + Auth Section */}
        <div className="uv-login-hero-container">
          {/* Left Flowing Editorial & Categories Showcase */}
          <section className="uv-login-editorial" aria-label="Presentación Tienda Univalle">
            <div className="uv-login-editorial-header">
              <span className="uv-login-kicker">
                <span className="uv-kicker-dot" />
                COMERCIO ELECTRÓNICO UNIVERSITARIO · EST. 1945
              </span>
              <h2 className="uv-login-hero-title">
                Todo el talento y la identidad de{' '}
                <span>Univalle</span> en un solo ecosistema.
              </h2>
              <p className="uv-login-hero-lead">
                Adquiere indumentaria oficial, publicaciones académicas y
                productos creados por estudiantes, docentes y administrativos de
                nuestra universidad, con envíos calculados desde el campus.
              </p>
            </div>

            {/* Category Preview Bento Grid */}
            <div className="uv-login-bento-grid" aria-hidden="true">
              <article className="uv-login-bento-card">
                <div className="uv-bento-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                  </svg>
                </div>
                <div>
                  <strong>Ropa & Souvenirs UV</strong>
                  <span>Prendas con selección de tallas S a XXL</span>
                </div>
              </article>

              <article className="uv-login-bento-card">
                <div className="uv-bento-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div>
                  <strong>Libros & Material Académico</strong>
                  <span>Editorial Univalle, guías y papelería</span>
                </div>
              </article>

              <article className="uv-login-bento-card">
                <div className="uv-bento-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <strong>Tu Propia Tienda UV</strong>
                  <span>Publica y gestiona tu inventario</span>
                </div>
              </article>

              <article className="uv-login-bento-card">
                <div className="uv-bento-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div>
                  <strong>Envío por Distancia</strong>
                  <span>Cálculo automático en Cali y área metropolitana</span>
                </div>
              </article>
            </div>

            {/* Institutional Metrics Strip */}
            <div className="uv-login-metrics-bar" aria-hidden="true">
              <div className="uv-login-metric">
                <strong>100%</strong>
                <span>Comunidad @correounivalle.edu.co</span>
              </div>
              <div className="uv-login-metric-divider" />
              <div className="uv-login-metric">
                <strong>3 Roles</strong>
                <span>Estudiante · Docente · Administrativo</span>
              </div>
              <div className="uv-login-metric-divider" />
              <div className="uv-login-metric">
                <strong>Cupones UV</strong>
                <span>Descuentos institucionales activos</span>
              </div>
            </div>
          </section>

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
                  ? 'Ingresa con tus credenciales institucionales para explorar el catálogo y gestionar tus pedidos.'
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

        {/* Bottom Flowing Steps Strip before Footer */}
        <section className="uv-login-steps-strip" aria-label="Cómo funciona Tienda Univalle">
          <div className="uv-login-step-item">
            <span className="uv-login-step-num">01</span>
            <div>
              <strong>Activa e Ingresa con tu Correo UV</strong>
              <p>Validación instantánea con el censo universitario de estudiantes, docentes y administrativos.</p>
            </div>
          </div>
          <div className="uv-login-step-item">
            <span className="uv-login-step-num">02</span>
            <div>
              <strong>Explora o Publica en tu Tienda</strong>
              <p>Inspecciona productos a detalle con tallas y vendedores, o administra tus propias publicaciones desde tu perfil.</p>
            </div>
          </div>
          <div className="uv-login-step-item">
            <span className="uv-login-step-num">03</span>
            <div>
              <strong>Recibe en el Campus o en tu Casa</strong>
              <p>Calculamos el envío según los kilómetros desde Univalle y aplicamos cupones institucionales.</p>
            </div>
          </div>
        </section>
      </main>

      <UnivalleFooter />
    </div>
  )
}

export default LoginPage
