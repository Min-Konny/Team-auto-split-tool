import { Box } from '@chakra-ui/react'
import { GameRole } from '@/types'

const ROLE_VAR: Record<GameRole, string> = {
  TOP: 'var(--r-top)',
  JUNGLE: 'var(--r-jng)',
  MID: 'var(--r-mid)',
  ADC: 'var(--r-adc)',
  SUP: 'var(--r-sup)',
}

export interface RoleBadgeProps {
  role: GameRole | string
}

/** 統一ロールバッジ（幅 58px） */
export default function RoleBadge({ role }: RoleBadgeProps) {
  const c = ROLE_VAR[role as GameRole] ?? 'var(--fg-2)'
  return (
    <Box
      as="span"
      display="inline-block"
      w="58px"
      textAlign="center"
      px={0}
      py="3px"
      borderRadius="5px"
      fontFamily="'JetBrains Mono', ui-monospace, monospace"
      fontSize="10px"
      fontWeight={600}
      letterSpacing="0.05em"
      bg="var(--bg-2)"
      color={c}
      borderWidth="1px"
      borderStyle="solid"
      sx={{
        borderColor: `color-mix(in oklch, ${c} 35%, transparent)`,
      }}
      lineHeight={1.2}
      transition="all 0.15s ease"
    >
      {role}
    </Box>
  )
}
