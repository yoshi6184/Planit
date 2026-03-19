import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

/** Set to false to revert to the original landing hero (no fuel background, no rocket). */
const USE_AMPLEMARKET_HERO = false

/* 1=Taste, 2=Image by image, 3=Regardless, 4=Simple/Fast/Secure, 5=Stats (Designed to compound) */
const getScrollThresholds = () => ({
  taste: window.innerHeight * 0.15,
  imageByImage: window.innerHeight * 1.2,
  financialRight: window.innerHeight * 2.0,
  howItWorksIntro: window.innerHeight * 2.8,
  statsPage: window.innerHeight * 3.6,
})

const CYCLING_WORDS = ['age', 'education', 'circumstances', 'race', 'gender', 'income']

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
  const [scrolled3, setScrolled3] = useState(false)
  const [scrolled4, setScrolled4] = useState(false)
  const [scrolled5, setScrolled5] = useState(false)
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [num3, setNum3] = useState(0)
  const [page3Key, setPage3Key] = useState(0)
  const [page4Key, setPage4Key] = useState(0)
  const [cyclingIndex, setCyclingIndex] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
    setScrolled(false)
    setScrolled2(false)
    setScrolled3(false)
    setScrolled4(false)
    setScrolled5(false)
    setNum1(0)
    setNum2(0)
    setNum3(0)
    const onScroll = () => {
      const y = window.scrollY
      const { taste, imageByImage, financialRight, howItWorksIntro, statsPage } = getScrollThresholds()
      if (y <= 0) {
        setScrolled(false)
        setScrolled2(false)
        setScrolled3(false)
        setScrolled4(false)
        setScrolled5(false)
        setNum1(0)
        setNum2(0)
        setNum3(0)
        return
      }
      setScrolled(y > taste)
      setScrolled2(y > imageByImage)
      setScrolled3(y > financialRight)
      setScrolled4(y > howItWorksIntro)
      setScrolled5(y > statsPage)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    if (scrolled2) setPage3Key((k) => k + 1)
  }, [scrolled2])

  useEffect(() => {
    if (scrolled3) {
      setPage4Key((k) => k + 1)
      setCyclingIndex(0)
    }
  }, [scrolled3])

  useEffect(() => {
    if (!scrolled5) return
    const duration = 1200
    const steps = 24
    const stepMs = duration / steps
    let step = 0
    const id = setInterval(() => {
      step++
      const t = step / steps
      const ease = 1 - Math.pow(1 - t, 2)
      setNum1(Math.round(8 * ease))
      setNum2(Math.round(30 * ease))
      setNum3(Math.round(98 * ease))
      if (step >= steps) {
        setNum1(8)
        setNum2(30)
        setNum3(98)
        clearInterval(id)
      }
    }, stepMs)
    return () => clearInterval(id)
  }, [scrolled5])

  useEffect(() => {
    if (!scrolled3) return
    const id = setInterval(() => {
      setCyclingIndex((i) => (i + 1) % CYCLING_WORDS.length)
    }, 800)
    return () => clearInterval(id)
  }, [scrolled3, page4Key])

  const HOW_IT_WORKS_STEPS = [
    {
      title: 'Set your budget',
      description: 'Each dollar should have a purpose.',
    },
    {
      title: 'Log expenses',
      description: 'Add expenses in seconds with voice input or images. Backfill missed days.',
    },
    {
      title: 'Choose a daily check-in',
      description: 'Stay in control, sleep better at night and achieve your goals.',
    },
  ]

  return (
    <div className={`landing ${scrolled ? 'landing-scrolled' : ''} ${scrolled2 ? 'landing-scrolled-2' : ''} ${scrolled3 ? 'landing-scrolled-3' : ''} ${scrolled4 ? 'landing-scrolled-4' : ''} ${scrolled5 ? 'landing-scrolled-5' : ''}`}>
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-header-left">
            <Link to="/" className="landing-logo">
              <Logo className="landing-logo-brand" />
            </Link>
            <nav className="landing-nav">
              <Link to="/dashboard" className="landing-nav-link">
                Products
              </Link>
              <Link to="/reports" className="landing-nav-link">
                Who we are
              </Link>
              <Link to="/reports" className="landing-nav-link">
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

      <main className={`landing-hero ${USE_AMPLEMARKET_HERO ? 'landing-hero-ample' : ''}`}>
        {USE_AMPLEMARKET_HERO && (
          <>
            <div className="landing-hero-fuel-bg" aria-hidden>
              <div className="landing-hero-fuel-stream landing-hero-fuel-stream-1" aria-hidden />
              <div className="landing-hero-fuel-stream landing-hero-fuel-stream-2" aria-hidden />
              <div className="landing-hero-fuel-noise" aria-hidden />
            </div>
            <div className="landing-hero-rocket-wrap" aria-hidden>
              <div className="landing-hero-rocket">
                <svg viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="landing-rocket-svg">
                  <title>Rocket</title>
                  <path d="M60 8 L62 8 L62 22 L58 22 L58 8 Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M52 18 L68 18" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M55 14 L55 26 M65 14 L65 26" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
                  <ellipse cx="60" cy="6" rx="5" ry="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  <path d="M60 28 L58 85 L60 90 L62 85 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  <path d="M60 35 L95 165 L60 182 L25 165 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
                  <path d="M38 75 L48 72 L52 80 L42 88 M82 75 L72 72 L68 80 L78 88" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7" strokeLinejoin="round" />
                  <path d="M45 110 L50 108 L52 115 M75 110 L70 108 L68 115" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
                  <path d="M25 165 Q60 160 95 165" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <path d="M60 182 L60 200" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M48 198 L60 200 L72 198" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
                <div className="landing-hero-rocket-exhaust" />
              </div>
            </div>
          </>
        )}
        <div className="landing-hero-inner landing-hero-content">
          <section className="landing-hero-copy">
            <p className="landing-hero-announce">
              <span className="landing-hero-announce-dot" />
              Early access launching soon
            </p>
            <h1 className="landing-headline">
              Financial freedom
              <br />
              is a <span className="landing-headline-underline">choice</span>
            </h1>
            <p className="landing-subheadline">
              Simplify spending, clarify priorities, and bring more joy to every dollar.
            </p>
            <div className="landing-cta-row">
              <Link to="/onboarding" className="landing-cta-get-started">
                Get started — it's free
              </Link>
            </div>
            <p className="landing-cta-note">No credit card required</p>
          </section>
          <div className="landing-hero-dashboard" aria-hidden>
            <img src="/hero-dashboard.png" alt="" className="landing-hero-dashboard-img" loading="lazy" />
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

        <div className="landing-quote-overlay landing-quote-overlay-3" aria-hidden key={page4Key}>
          <div className="landing-quote-overlay-2-text-wrap">
            <p className="landing-quote-text landing-quote-text-3">
              <span className="landing-quote-text-3-second-line">
                Regardless of your{' '}
                <span className="landing-quote-cycling" key={`${page4Key}-${cyclingIndex}`}>
                  {CYCLING_WORDS[cyclingIndex]}
                </span>
              </span>
            </p>
          </div>
        </div>

        <div className="landing-quote-overlay landing-quote-overlay-4" aria-hidden>
          <div className="landing-quote-overlay-2-text-wrap">
            <p className="landing-quote-text landing-quote-text-4">Simple, Fast and Secure.</p>
          </div>
        </div>

        <div className="landing-stats-page" aria-hidden>
          <div className="landing-stats-bg" />
          <div className="landing-stats-inner">
            <div className="landing-stats-content">
              <h2 className="landing-stats-title">
                Designed to
                <br />
                compound advantage
              </h2>
              <div className="landing-stats-kpis">
                <div className="landing-stats-kpi">
                  <span className="landing-stats-number">{num1}%</span>
                  <span className="landing-stats-label">Average revenue boost</span>
                </div>
                <div className="landing-stats-kpi">
                  <span className="landing-stats-number">{num2}%</span>
                  <span className="landing-stats-label">Average savings increase</span>
                </div>
                <div className="landing-stats-kpi">
                  <span className="landing-stats-number">{num3}%</span>
                  <span className="landing-stats-label">Customer Retention Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

