import type { CSSProperties } from 'react'
import { GameRole } from '@/types'

const ROLE_COLOR: Record<GameRole,string> = {
  TOP:'var(--r-top)', JUNGLE:'var(--r-jng)', MID:'var(--r-mid)', ADC:'var(--r-adc)', SUP:'var(--r-sup)',
}
const PATHS: Record<string,string> = {
  TOP:'M4 4h16v16h-5V9H4Z M4 12h8v8H4Z',
  JUNGLE:'M12 21 5 14 3 4l6 6 3 7 3-7 6-6-2 10Z M12 3v9',
  MID:'M4 4h8L4 12Z M20 20h-8l8-8Z M5 19 19 5',
  ADC:'M5 4h14v16H5Z M9 8h6v8H9Z',
  SUP:'M12 4 16 8 12 12 8 8Z M3 9l6 4 3 8 3-8 6-4',
}
export default function RoleBadge({role,sm=false}:{role:string;sm?:boolean}) {
  const color = ROLE_COLOR[role as GameRole] ?? 'var(--fg-2)'
  return <span className={`role-badge${sm ? ' role-badge-sm' : ''}`} style={{'--role-color':color} as CSSProperties}>
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d={PATHS[role] ?? PATHS.MID}/></svg>
    <span>{role === 'JUNGLE' ? 'JG' : role}</span>
  </span>
}
