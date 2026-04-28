import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Button,
  Collapse,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { GameRole, Match, Player } from '@/types'
import Layout from '@/components/Layout'
import RoleBadge from '@/components/RoleBadge'
import Card from '@/components/Card'

interface MatchWithPlayers extends Omit<Match, 'players'> {
  players: {
    player: Player
    role: string
    team: 'BLUE' | 'RED'
  }[]
}

type FilterMode = 'ALL' | 'BLUE' | 'RED'

export default function Matches() {
  const [matches, setMatches] = useState<MatchWithPlayers[]>([])
  const [filter, setFilter] = useState<FilterMode>('ALL')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playersSnapshot = await getDocs(collection(db, 'players'))
        const playersData = playersSnapshot.docs.reduce(
          (acc, doc) => ({
            ...acc,
            [doc.id]: { id: doc.id, ...doc.data() } as Player,
          }),
          {} as { [key: string]: Player }
        )
        const matchesSnapshot = await getDocs(query(collection(db, 'matches'), orderBy('date', 'desc')))
        const matchesData = matchesSnapshot.docs.map((docSnap) => {
          const match = { id: docSnap.id, ...docSnap.data() } as Match
          return {
            ...match,
            players: match.players.map((p) => ({
              ...p,
              player: playersData[p.playerId],
            })),
          }
        }) as MatchWithPlayers[]
        setMatches(matchesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return matches
    if (filter === 'BLUE') return matches.filter((m) => m.winner === 'BLUE')
    return matches.filter((m) => m.winner === 'RED')
  }, [matches, filter])

  const blueWins = useMemo(() => matches.filter((m) => m.winner === 'BLUE').length, [matches])
  const redWins = useMemo(() => matches.filter((m) => m.winner === 'RED').length, [matches])
  const blueRate =
    matches.length > 0 ? Math.round((blueWins / matches.length) * 100) : 0
  const lastPlayed =
    matches.length > 0
      ? new Date(matches[0].date.seconds * 1000).toLocaleString('ja-JP')
      : '—'

  const filterBtn = (id: FilterMode, label: string) => (
    <Button
      size="sm"
      variant={filter === id ? 'solid' : 'outline'}
      colorScheme={filter === id ? 'lolPrimary' : undefined}
      borderRadius="full"
      onClick={() => setFilter(id)}
    >
      {label}
    </Button>
  )

  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        <Heading size="xl">試合履歴</Heading>

        <SimpleGrid columns={{ base: 1, md: 5 }} gap={4}>
          {[
            { label: '総試合', value: String(matches.length) },
            { label: 'BLUE 勝利', value: String(blueWins), color: 'var(--blue)' },
            { label: 'RED 勝利', value: String(redWins), color: 'var(--red)' },
            { label: 'BLUE 勝率', value: `${blueRate}%` },
            { label: '最新試合', value: lastPlayed },
          ].map((s) => (
            <Card key={s.label} isHoverable={false} p={4}>
              <Text fontSize="10px" color="var(--fg-3)" letterSpacing="0.12em" fontFamily="'JetBrains Mono', monospace">
                {s.label}
              </Text>
              <Text fontSize="xl" fontWeight={700} mt={2} sx={s.color ? { color: s.color } : undefined}>
                {s.value}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        <HStack spacing={2}>{filterBtn('ALL', 'ALL')}{filterBtn('BLUE', 'BLUE WIN')}{filterBtn('RED', 'RED WIN')}</HStack>

        <VStack spacing={3} align="stretch">
          {filtered.length === 0 ? (
            <Card isHoverable={false}>
              <Text color="var(--fg-2)" textAlign="center" py={8}>
                試合がありません
              </Text>
            </Card>
          ) : (
            filtered.map((match) => {
              const dt = new Date(match.date.seconds * 1000)
              const open = openId === match.id
              const borderSide = match.winner === 'BLUE' ? 'var(--blue-d)' : 'var(--red-d)'
              const blues = match.players.filter((p) => p.team === 'BLUE')
              const reds = match.players.filter((p) => p.team === 'RED')
              const blueAvg =
                blues.length > 0
                  ? Math.round(blues.reduce((acc, q) => acc + (q.player?.mainRate || 0), 0) / blues.length)
                  : 0
              const redAvg =
                reds.length > 0
                  ? Math.round(reds.reduce((acc, q) => acc + (q.player?.mainRate || 0), 0) / reds.length)
                  : 0
              const delta = Math.round(blueAvg - redAvg)

              return (
                <Card
                  key={match.id}
                  isHoverable={false}
                  borderLeftWidth="3px"
                  borderLeftColor={borderSide}
                  p={0}
                  overflow="hidden"
                >
                  <HStack spacing={4} p={4} align="stretch" justify="space-between" flexWrap="wrap">
                    <VStack align="start" spacing={1} minW="160px">
                      <Text fontSize="xs" fontFamily="'JetBrains Mono', monospace" color="var(--fg-3)">
                        {dt.toLocaleString('ja-JP')}
                      </Text>
                      <Badge
                        px={3}
                        py={1}
                        borderRadius="full"
                        bg={
                          match.winner === 'BLUE'
                            ? 'color-mix(in oklch, var(--blue) 18%, transparent)'
                            : 'color-mix(in oklch, var(--red) 18%, transparent)'
                        }
                        color="var(--fg-0)"
                        borderWidth="1px"
                        borderColor={borderSide}
                      >
                        {match.winner === 'BLUE' ? 'BLUE WIN' : 'RED WIN'}
                      </Badge>
                    </VStack>

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} flex="1">
                      <Box>
                        <Text fontSize="10px" color="var(--blue)" mb={2} letterSpacing="0.1em">
                          BLUE TEAM
                        </Text>
                        <VStack align="stretch" spacing={2}>
                          {match.players
                            .filter((p) => p.team === 'BLUE')
                            .map((line) => (
                              <HStack key={line.player?.id ?? line.role}>
                                <RoleBadge role={(line.role as GameRole)} />
                                <Text fontSize="sm" flex="1" noOfLines={1}>
                                  {line.player?.nickname || line.player?.name || '---'}
                                </Text>
                              </HStack>
                            ))}
                        </VStack>
                      </Box>

                      <VStack spacing={2} justify="center" py={4}>
                        <Text fontFamily="heading" fontWeight={800}>
                          VS
                        </Text>
                        <Text fontFamily="'JetBrains Mono', monospace" fontSize="sm" color={delta >= 0 ? 'var(--blue)' : 'var(--red)'}>
                          Δ {delta >= 0 ? '+' : ''}
                          {delta}
                        </Text>
                      </VStack>

                      <Box textAlign={{ base: 'left', md: 'right' }}>
                        <Text fontSize="10px" color="var(--red)" mb={2} letterSpacing="0.1em">
                          RED TEAM
                        </Text>
                        <VStack align="stretch" spacing={2}>
                          {match.players
                            .filter((p) => p.team === 'RED')
                            .map((line) => (
                              <HStack key={line.player?.id ?? line.role} justify="flex-end">
                                <Text fontSize="sm" flex="1" noOfLines={1}>
                                  {line.player?.nickname || line.player?.name || '---'}
                                </Text>
                                <RoleBadge role={(line.role as GameRole)} />
                              </HStack>
                            ))}
                        </VStack>
                      </Box>
                    </SimpleGrid>

                    <Button variant="ghost" size="sm" onClick={() => setOpenId(open ? null : match.id)} rightIcon={open ? <ChevronUpIcon /> : <ChevronDownIcon />}>
                      詳細
                    </Button>
                  </HStack>

                  <Collapse in={open}>
                    <Box px={4} pb={4} pt={2} borderTopWidth="1px" borderTopColor="var(--line)" bg="var(--bg-0)">
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                        <Box>
                          <Text fontSize="xs" color="var(--blue)" mb={2}>
                            Blue メンバー詳細
                          </Text>
                          <Table size="sm">
                            <Thead>
                              <Tr>
                                <Th>名前</Th>
                                <Th>ロール</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {match.players
                                .filter((p) => p.team === 'BLUE')
                                .map((line) => (
                                  <Tr key={line.role + (line.player?.name || '')}>
                                    <Td>{line.player?.name || '—'}</Td>
                                    <Td>{line.role}</Td>
                                  </Tr>
                                ))}
                            </Tbody>
                          </Table>
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="xs" color="var(--fg-3)" mb={2}>
                            試合結果
                          </Text>
                          <Text fontFamily="'JetBrains Mono', monospace">{match.winner} サイド勝利</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="var(--red)" mb={2}>
                            Red メンバー詳細
                          </Text>
                          <Table size="sm">
                            <Thead>
                              <Tr>
                                <Th>名前</Th>
                                <Th>ロール</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {match.players
                                .filter((p) => p.team === 'RED')
                                .map((line) => (
                                  <Tr key={line.role + (line.player?.name || '')}>
                                    <Td>{line.player?.name || '—'}</Td>
                                    <Td>{line.role}</Td>
                                  </Tr>
                                ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  </Collapse>
                </Card>
              )
            })
          )}
        </VStack>
      </VStack>
    </Layout>
  )
}
