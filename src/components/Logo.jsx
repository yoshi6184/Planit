export default function Logo({ className = '' }) {
  return (
    <span
      className={`logo-text ${className}`}
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        background: 'linear-gradient(135deg, #5a5a5a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0.5px 0.5px 0.4px rgba(26,26,26,0.25))',
      }}
    >
      ProjectParity
    </span>
  )
}
