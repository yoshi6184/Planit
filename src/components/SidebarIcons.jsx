/**
 * Monoline outline icons for the sidebar (Lucide/Heroicons style).
 * Use currentColor so they inherit link color; active state uses --mercury-accent via CSS.
 * Locked to 18×18 with stroke 2 for balance with label typography.
 */
const iconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconHome(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}

export function IconTransactions(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

export function IconReports(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M7 14v4M11 10v8M15 6v12M19 2v16" />
    </svg>
  )
}

export function IconGoals(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </svg>
  )
}

export function IconPlan(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function IconTasks(props) {
  return (
    <svg {...iconProps} {...props} aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
