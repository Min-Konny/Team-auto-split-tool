import { Box } from '@chakra-ui/react'
import { Rank } from '@/types'
import { getRankFromRate } from '@/lib/rankUtils'

/** DESIGN_SYSTEM と同じランク別カラー（CSS 値） */
const RANK_CHIP_COLORS: Record<Rank, string> = {
  UNRANKED: 'var(--fg-3)',
  IRON: 'var(--fg-3)',
  BRONZE: '#cd7f32',
  SILVER: '#a8a9ad',
  GOLD: 'var(--gold)',
  PLATINUM: 'oklch(0.72 0.15 180)',
  EMERALD: 'oklch(0.74 0.18 155)',
  DIAMOND: 'var(--blue)',
  MASTER: 'var(--r-adc)',
  GRANDMASTER: 'var(--r-top)',
  CHALLENGER: 'var(--gold)',
}

export interface RankChipProps {
  /** レート（メイン or サブ） */
  rate: number
}

export default function RankChip({ rate }: RankChipProps) {
  const rank = getRankFromRate(rate)
  const color = RANK_CHIP_COLORS[rank]
  return (
    <Box
      as="span"
      display="inline-block"
      fontFamily="'JetBrains Mono', ui-monospace, monospace"
      fontSize="10px"
      fontWeight={600}
      px={2}
      py="2px"
      borderRadius="5px"
      letterSpacing="0.04em"
      color={color}
      bg={`color-mix(in oklch, ${color} 15%, transparent)`}
      borderWidth="1px"
      borderStyle="solid"
      sx={{
        borderColor: `color-mix(in oklch, ${color} 35%, transparent)`,
      }}
      transition="all 0.15s ease"
    >
      {rank}
    </Box>
  )
}
