import { Box } from '@chakra-ui/react'
import { GameRole } from '@/types'

const ROLE_COLOR: Record<GameRole, string> = {
  TOP: 'var(--r-top)',
  JUNGLE: 'var(--r-jng)',
  MID: 'var(--r-mid)',
  ADC: 'var(--r-adc)',
  SUP: 'var(--r-sup)',
}

export default function RoleBadge({ role, sm = false }: { role: string; sm?: boolean }) {
  const color = (ROLE_COLOR[role as GameRole] ?? 'var(--fg-2)')
  return (
    <Box
      as="span"
      display="inline-block"
      textAlign="center"
      w={sm ? '48px' : '58px'}
      py={sm ? '2px' : '3px'}
      fontFamily="'JetBrains Mono', monospace"
      fontSize={sm ? '9px' : '10px'}
      fontWeight={600}
      letterSpacing="0.05em"
      borderRadius="5px"
      bg="var(--bg-2)"
      color={color}
      border="1px solid"
      sx={{ borderColor: `color-mix(in oklch, ${color} 35%, transparent)` }}
    >
      {role}
    </Box>
  )
}
