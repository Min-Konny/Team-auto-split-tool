import { GameRole } from '@/types'
import { ROLE_TIER_LABEL } from '@/lib/roleTier'
import { RoleMap, RoleTier } from '@/types/member'

const ROLES: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]
const TIERS: RoleTier[] = ['MAIN', 'SUB', 'OK', 'NG']

type Props = {
  roles: RoleMap
  onChange: (roles: RoleMap) => void
}

export default function RoleTierGrid({ roles, onChange }: Props) {
  const setTier = (role: GameRole, tier: RoleTier) => {
    const next = { ...roles }
    if (tier === 'MAIN') {
      for (const r of ROLES) {
        if (r === role) next[r] = 'MAIN'
        else if (next[r] === 'MAIN') next[r] = 'OK'
      }
    } else {
      const wasMain = next[role] === 'MAIN'
      next[role] = tier
      if (wasMain) {
        const other = ROLES.find((r) => r !== role && next[r] !== 'NG')
        if (other) next[other] = 'MAIN'
      }
    }
    onChange(next)
  }

  return (
    <div className="rtg-wrap">
      <div className="rtg-hd">
        <span />
        {TIERS.map((t) => (
          <span key={t} className="rtg-tier-h">
            {ROLE_TIER_LABEL[t]}
          </span>
        ))}
      </div>
      {ROLES.map((role) => (
        <div key={role} className="rtg-row">
          <span className={`rtg-role ${role}`}>{role}</span>
          {TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              className={`rtg-cell${roles[role] === tier ? ' on' : ''}`}
              onClick={() => setTier(role, tier)}
            >
              {ROLE_TIER_LABEL[tier]}
            </button>
          ))}
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: rtgCss }} />
    </div>
  )
}

const rtgCss = `
.rtg-wrap{display:flex;flex-direction:column;gap:4px}
.rtg-hd,.rtg-row{display:grid;grid-template-columns:72px repeat(4,1fr);gap:4px;align-items:center}
.rtg-tier-h,.rtg-role{font-family:'JetBrains Mono';font-size:10px;text-align:center;color:var(--fg-3)}
.rtg-role{font-weight:600;color:var(--fg-1)}
.rtg-cell{padding:8px 4px;border-radius:6px;border:1px solid var(--line);background:var(--bg-0);font-family:'JetBrains Mono';font-size:11px;color:var(--fg-2);cursor:pointer}
.rtg-cell.on{background:color-mix(in oklch,var(--blue) 18%,var(--bg-0));border-color:var(--blue-d);color:var(--blue);font-weight:700}
`
