/**
 * Monoline outline icons for account types (same style as SidebarIcons).
 * 18×18, stroke 2, currentColor for consistency with sidebar nav.
 */
const iconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconAccountChecking(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <rect x="1" y="4" width="22" height="14" rx="2" ry="2" />
      <path d="M1 10h22" />
    </svg>
  )
}

export function IconAccountSavings(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <rect x="3" y="6" width="18" height="14" rx="2" ry="2" />
      <circle cx="12" cy="13" r="3" />
      <path d="M12 10v3M10.5 11.5h3" />
    </svg>
  )
}

export function IconAccountCredit(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

export function IconAccountTfsa(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  )
}

export function IconAccountRrsp(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <path d="M3 9l9-4 9 4v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}

export function IconAccountOther(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const ACCOUNT_ICONS = {
  checking: IconAccountChecking,
  savings: IconAccountSavings,
  credit: IconAccountCredit,
  tfsa: IconAccountTfsa,
  rrsp: IconAccountRrsp,
  other: IconAccountOther,
}

export function AccountIcon({ type, ...props }) {
  const Icon = ACCOUNT_ICONS[type] || IconAccountOther
  return <Icon {...props} />
}
