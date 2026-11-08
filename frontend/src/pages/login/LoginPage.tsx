import { useState, type FormEvent } from 'react'
import './LoginPage.css'

const institutionalEmailPattern = /^[a-zA-Z0-9._%+-]+@correounivalle\.edu\.co$/i

interface LoginPageProps {
  onAuthenticated: (accessToken: string, role: string) => void
}

interface AuthResponse {
  accessToken?: string
  message?: string | string[]
  user?: {
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
    const nextConfirmPasswordError = mode === 'activate' && password !== confirmPassword
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
      const result = await response.json() as AuthResponse

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
        setStatus('Cuenta activada. Ahora puedes iniciar sesión.')
        setStatusTone('success')
        return
      }

      if (!result.accessToken || !result.user?.role) {
        setStatus('El servicio respondió sin una sesión válida.')
        setStatusTone('error')
        return
      }

      onAuthenticated(result.accessToken, result.user.role)
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

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="login-brand__seal" aria-hidden="true">UV</span>
          <span className="login-brand__name">Univalle Shop</span>
          <span className="login-brand__caption">Tienda Univalle</span>
        </div>

        <div className="login-heading">
          <p className="login-eyebrow">Comunidad Universitaria del Valle</p>
          <h1 id="login-title">{mode === 'login' ? 'Inicia sesión' : 'Activa tu cuenta'}</h1>
          <p>{mode === 'login'
            ? 'Conecta con el talento y el espíritu emprendedor de nuestra comunidad UV Norte'
            : 'Usa el correo institucional autorizado para crear tu contraseña.'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => handleEmailChange(event.target.value)}
              placeholder="Ejemplo: juan.carlos@correounivalle.edu.co"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'login-email-error' : 'login-email-hint'}
            />
            {emailError ? (
              <span className="login-field__error" id="login-email-error" role="alert">{emailError}</span>
            ) : (
              <span className="login-field__hint" id="login-email-hint">Ingresa tu correo institucional</span>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                autoComplete="current-password"
                minLength={mode === 'activate' ? 8 : undefined}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'login-password-error' : undefined}
              />
              <button
                className="login-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {passwordError && (
              <span className="login-field__error" id="login-password-error" role="alert">{passwordError}</span>
            )}
          </div>

          {mode === 'activate' && (
            <div className="login-field">
              <label htmlFor="login-confirm-password">Confirmar contraseña</label>
              <input
                id="login-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setConfirmPasswordError('')
                }}
                autoComplete="new-password"
                aria-invalid={Boolean(confirmPasswordError)}
                aria-describedby={confirmPasswordError ? 'login-confirm-password-error' : undefined}
              />
              {confirmPasswordError && (
                <span className="login-field__error" id="login-confirm-password-error" role="alert">{confirmPasswordError}</span>
              )}
            </div>
          )}

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : 'Activar cuenta'}
          </button>
          {status && (
            <p className={`login-status login-status--${statusTone}`} role={statusTone === 'error' ? 'alert' : 'status'}>
              {status}
            </p>
          )}
        </form>

        <div className="login-divider" aria-hidden="true"><span>Acceso institucional</span></div>
        <p className="login-note">El acceso está reservado para personas con cuenta institucional de la Universidad del Valle</p>
        <button
          className="login-mode-switch"
          type="button"
          onClick={() => {
            setMode((currentMode) => currentMode === 'login' ? 'activate' : 'login')
            setStatus('')
            setEmailError('')
            setPasswordError('')
            setConfirmPasswordError('')
          }}
        >
          {mode === 'login' ? '¿Primera vez? Activa tu cuenta' : 'Volver a iniciar sesión'}
        </button>
      </section>
      <footer className="login-footer">© 2026 Univalle-Shop. Todos los derechos reservados</footer>
    </main>
  )
}

export default LoginPage