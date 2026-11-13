import './UnivalleFooter.css'

interface UnivalleFooterProps {
  onExploreClick?: () => void
}

function UnivalleFooter({ onExploreClick }: UnivalleFooterProps) {
  const handleTopScroll = () => {
    if (onExploreClick) {
      onExploreClick()
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="uv-footer" aria-label="Pie de página institucional Univalle">
      <div className="uv-footer-inner">
        <div className="uv-footer-top">
          <div className="uv-footer-brand-col">
            <p className="uv-footer-eyebrow">TIENDA OFICIAL</p>
            <h2 className="uv-footer-headline">
              Universidad
              <br />
              del Valle.
            </h2>
            <p className="uv-footer-subtext">Productos oficiales desde 1945.</p>
            <button
              type="button"
              className="uv-footer-explore-btn"
              onClick={handleTopScroll}
            >
              <span>EXPLORAR TIENDA</span>
              <span className="uv-footer-explore-circle" aria-hidden="true">
                ↗
              </span>
            </button>
          </div>

          <div className="uv-footer-nav-col">
            <h3>TIENDA</h3>
            <ul className="uv-footer-nav-list">
              <li>
                <button type="button" className="uv-footer-nav-link" onClick={handleTopScroll}>
                  Catálogo
                </button>
              </li>
              <li>
                <button type="button" className="uv-footer-nav-link" onClick={handleTopScroll}>
                  Colecciones
                </button>
              </li>
              <li>
                <button type="button" className="uv-footer-nav-link" onClick={handleTopScroll}>
                  Ofertas
                </button>
              </li>
              <li>
                <button type="button" className="uv-footer-nav-link" onClick={handleTopScroll}>
                  Novedades
                </button>
              </li>
            </ul>
          </div>

          <div className="uv-footer-nav-col">
            <h3>UNIVERSIDAD</h3>
            <ul className="uv-footer-nav-list">
              <li>
                <a
                  href="https://www.univalle.edu.co"
                  target="_blank"
                  rel="noreferrer"
                  className="uv-footer-nav-link"
                >
                  Sobre Univalle
                </a>
              </li>
              <li>
                <button type="button" className="uv-footer-nav-link" onClick={handleTopScroll}>
                  Contacto
                </button>
              </li>
              <li>
                <button type="button" className="uv-footer-nav-link" onClick={handleTopScroll}>
                  Blog
                </button>
              </li>
            </ul>
          </div>

          <div className="uv-footer-nav-col">
            <h3>SOCIAL</h3>
            <ul className="uv-footer-nav-list">
              <li>
                <a
                  href="https://www.instagram.com/univallecol"
                  target="_blank"
                  rel="noreferrer"
                  className="uv-footer-nav-link"
                >
                  <span className="uv-footer-social-icon" aria-hidden="true">◎</span>
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/univallecol"
                  target="_blank"
                  rel="noreferrer"
                  className="uv-footer-nav-link"
                >
                  <span className="uv-footer-social-icon" aria-hidden="true">𝕏</span>
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/school/universidad-del-valle"
                  target="_blank"
                  rel="noreferrer"
                  className="uv-footer-nav-link"
                >
                  <span className="uv-footer-social-icon" aria-hidden="true">in</span>
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

          <div className="uv-footer-nav-col">
            <h3>LEGAL</h3>
            <ul className="uv-footer-nav-list">
              <li>
                <button type="button" className="uv-footer-nav-link" onClick={handleTopScroll}>
                  Privacidad
                </button>
              </li>
              <li>
                <button type="button" className="uv-footer-nav-link" onClick={handleTopScroll}>
                  Términos
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="uv-footer-meta">
          <span>© 2026 UNIVERSIDAD DEL VALLE</span>
          <span>CALI — COLOMBIA</span>
        </div>

        <div className="uv-footer-watermark" aria-hidden="true">
          UNIVALLE
        </div>
      </div>
    </footer>
  )
}

export default UnivalleFooter

