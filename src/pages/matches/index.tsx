import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
} from '@chakra-ui/react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Match, Player } from '../../types'
import Layout from '../../components/Layout'
import Card from '../../components/Card'

interface MatchWithPlayers extends Omit<Match, 'players'> {
  players: {
    player: Player
    role: string
    team: 'BLUE' | 'RED'
  }[]
}

export default function Matches() {
  const [matches, setMatches] = useState<MatchWithPlayers[]>([])
  const [players, setPlayers] = useState<{ [key: string]: Player }>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        // プレイヤー情報の取得
        const playersSnapshot = await getDocs(collection(db, 'players'))
        const playersData = playersSnapshot.docs.reduce(
          (acc, doc) => ({
            ...acc,
            [doc.id]: { id: doc.id, ...doc.data() } as Player,
          }),
          {} as { [key: string]: Player }
        )
        setPlayers(playersData)

        // 試合情報の取得
        const matchesSnapshot = await getDocs(
          query(collection(db, 'matches'), orderBy('date', 'desc'))
        )
        const matchesData = matchesSnapshot.docs.map((doc) => {
          const match = { id: doc.id, ...doc.data() } as Match
          return {
            ...match,
            players: match.players.map((p) => ({
              ...p,
              player: playersData[p.playerId],
            })),
          }
        })
        setMatches(matchesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        <Heading color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
          試合履歴
        </Heading>

        <Card p={0}>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>日時</Th>
                  <Th>ブルーチーム</Th>
                  <Th>レッドチーム</Th>
                  <Th>勝者</Th>
                </Tr>
              </Thead>
              <Tbody>
                {matches.map((match) => (
                  <Tr key={match.id}>
                    <Td>
                      {new Date(match.date.seconds * 1000).toLocaleString()}
                    </Td>
                    <Td>
                      {match.players
                        .filter((p) => p.team === 'BLUE')
                        .map((p) => `${p.player?.name || '不明'} (${p.role})`)
                        .join(', ')}
                    </Td>
                    <Td>
                      {match.players
                        .filter((p) => p.team === 'RED')
                        .map((p) => `${p.player?.name || '不明'} (${p.role})`)
                        .join(', ')}
                    </Td>
                    <Td>{match.winner}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
      </VStack>
    </Layout>
  )
} 