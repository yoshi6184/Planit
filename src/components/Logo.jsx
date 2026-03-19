import planitLogo from '../assets/planit-logo-temp.png.jpg'

export default function Logo({ className = '' }) {
  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      {/* Temporary: use provided bitmap logo */}
      <img
        src={planitLogo}
        alt="Planit logo"
        style={{ width: 26, height: 26, display: 'block' }}
      />
      <span
        className="logo-text"
        style={{
          fontFamily: '"Plus Jakarta Sans", "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          fontSize: '1.1rem',
          color: '#5b6bff',
          textTransform: 'lowercase',
        }}
      >
        planit
      </span>
    </div>
  )
}
