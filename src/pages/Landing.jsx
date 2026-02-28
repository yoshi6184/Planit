import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

/* Viewport-based: page 1 = hero, page 2 = Taste, page 3 = Image by image */
const getScrollThresholds = () => ({
  taste: window.innerHeight * 0.45,
  imageByImage: window.innerHeight * 1.45,
})

const COSMOS_IMAGES = [
  { id: 1, left: '8%', top: '18%', size: 100 },
  { id: 2, left: '78%', top: '12%', size: 88 },
  { id: 3, left: '15%', top: '52%', size: 120 },
  { id: 4, left: '72%', top: '48%', size: 95 },
  { id: 5, left: '5%', top: '78%', size: 82 },
  { id: 6, left: '85%', top: '72%', size: 110 },
  { id: 7, left: '42%', top: '8%', size: 75 },
  { id: 8, left: '55%', top: '65%', size: 90 },
  { id: 9, left: '22%', top: '32%', size: 85 },
  { id: 10, left: '68%', top: '28%', size: 98 },
  { id: 11, left: '35%', top: '82%', size: 70 },
  { id: 12, left: '88%', top: '42%', size: 105 },
  { id: 13, left: '12%', top: '68%', size: 92 },
  { id: 14, left: '62%', top: '15%', size: 80 },
  { id: 15, left: '28%', top: '88%', size: 78 },
  { id: 16, left: '92%', top: '58%', size: 88 },
  { id: 17, left: '48%', top: '38%', size: 115 },
  { id: 18, left: '18%', top: '42%', size: 72 },
  { id: 19, left: '75%', top: '85%', size: 95 },
  { id: 20, left: '38%', top: '22%', size: 82 },
]

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [scrolled2, setScrolled2] = useState(false)
  const [page3Key, setPage3Key] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const { taste, imageByImage } = getScrollThresholds()
      setScrolled(y > taste)
      setScrolled2(y > imageByImage)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    if (scrolled2) setPage3Key((k) => k + 1)
  }, [scrolled2])

  return (
    <div className={`landing ${scrolled ? 'landing-scrolled' : ''} ${scrolled2 ? 'landing-scrolled-2' : ''}`}>
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-header-left">
            <Link to="/" className="landing-logo">
              <Logo className="landing-logo-brand" />
            </Link>
            <nav className="landing-nav">
              <Link to="/dashboard" className="landing-nav-link">
                Who we are
              </Link>
              <Link to="/reports" className="landing-nav-link">
                Who we are
              </Link>
              <Link to="/goals" className="landing-nav-link">
                Learn
              </Link>
            </nav>
          </div>
          <div className="landing-header-right">
            <Link to="/onboarding" className="landing-nav-link landing-nav-signin">
              Log in
            </Link>
            <Link to="/onboarding" className="landing-btn landing-btn-header">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-hero-inner landing-hero-content">
          <section className="landing-hero-copy">
            <p className="landing-hero-announce">Announcing $100M Series B by OpenAI</p>
            <h1 className="landing-headline">
              Financial freedom
              <br />
              is a <span className="landing-headline-underline">choice</span>
            </h1>
            <p className="landing-subheadline">
              We're a team of dreamers and builders on a mission to make finance accessible to all.
              <br />
              We believe that people with passion can change the world for the better.
            </p>
            <div className="landing-cta-row">
              <Link to="/onboarding" className="landing-cta-get-started">
                Get started
              </Link>
            </div>
          </section>
          <div className="landing-hero-visual" aria-hidden>
            <img src="/hero-phones.png" alt="" className="landing-hero-img" />
          </div>
        </div>

        <div className="landing-quote-overlay" aria-hidden>
          <p className="landing-quote-text">
            Taste isn't born.
            <br />
            It's built.
          </p>
        </div>

        <div className="landing-quote-overlay landing-quote-overlay-2" aria-hidden>
          <div className="landing-quote-overlay-2-text-wrap">
            <p className="landing-quote-text landing-quote-text-2">
              Image by image.
              <br />
              Day by day.
            </p>
          </div>
          <div className="landing-cosmos-images" key={page3Key}>
            {COSMOS_IMAGES.map((img) => (
              <div
                key={img.id}
                className="landing-cosmos-img"
                style={{
                  left: img.left,
                  top: img.top,
                  width: img.size,
                  height: img.size,
                  animationDelay: `${img.id * 0.04}s`,
                }}
              >
                <img
                  src={`https://picsum.photos/seed/${img.id + 100}/200/200`}
                  alt=""
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

