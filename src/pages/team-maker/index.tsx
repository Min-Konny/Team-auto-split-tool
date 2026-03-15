import { useEffect, useState, useRef } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  VStack,
  Text,
  HStack,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuGroup,
  MenuItem,
  Badge,
  IconButton,
  Divider,
  useColorModeValue,
  Checkbox,
  CheckboxGroup,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Radio,
  RadioGroup,
  Flex,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import { SearchIcon, DeleteIcon, RepeatIcon } from '@chakra-ui/icons'
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, Role, GameRole, Match, Rank, RANK_RATES } from '../../types'
import Layout from '../../components/Layout'

interface SelectedPlayer {
  player: Player & { id: string }
  unwantedRoles: GameRole[]
}

type RoleSelectionMode = 'auto' | 'manual'

// レートからランクを判定する関数
const getRankFromRate = (rate: number): Rank => {
  if (rate >= 3000) return 'CHALLENGER'
  if (rate >= 2700) return 'GRANDMASTER'
  if (rate >= 2500) return 'MASTER'
  if (rate >= 2200) return 'DIAMOND'
  if (rate >= 2000) return 'EMERALD'
  if (rate >= 1900) return 'PLATINUM'
  if (rate >= 1700) return 'GOLD'
  if (rate >= 1500) return 'SILVER'
  if (rate >= 1300) return 'BRONZE'
  if (rate >= 600) return 'IRON'
  return 'UNRANKED'
}

// ランクの色を取得する関数
const getRankColor = (rank: Rank): string => {
  const colors: { [key in Rank]: string } = {
    UNRANKED: 'gray',
    IRON: 'gray',
    BRONZE: 'orange',
    SILVER: 'gray',
    GOLD: 'yellow',
    PLATINUM: 'green',
    EMERALD: 'teal',
    DIAMOND: 'blue',
    MASTER: 'purple',
    GRANDMASTER: 'pink',
    CHALLENGER: 'red'
  }
  return colors[rank] || 'gray'
}

export default function TeamMaker() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([])
  const [teams, setTeams] = useState<{
    blue: { player: Player; role: GameRole }[]
    red: { player: Player; role: GameRole }[]
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [roleSelectionMode, setRoleSelectionMode] = useState<RoleSelectionMode>('auto')
  const [isRoleAssignmentMode, setIsRoleAssignmentMode] = useState(false)
  const [isMatchResultRegistered, setIsMatchResultRegistered] = useState(false)
  const [rateDifferenceTolerance, setRateDifferenceTolerance] = useState<number>(500) // レート差の許容値（デフォルト500）
  const teamsRef = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, 'players'))
      const playersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[]
      setPlayers(playersData)
    }

    fetchPlayers()
  }, [])

  // ページを離れようとした際の確認ダイアログ
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (teams && !isMatchResultRegistered) {
        const message = '試合結果を登録していませんが、よろしいですか？'
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [teams, isMatchResultRegistered])

  // 利用可能なタグを取得
  const availableTags = Array.from(
    new Set(
      players
        .flatMap(player => player.tags || [])
        .filter(tag => tag.trim() !== '')
    )
  ).sort()

  // フィルタリングされたプレイヤー
  const filteredPlayers = players.filter((player) => {
    const displayName = player.nickname || player.name
    const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => player.tags?.includes(tag))
    return matchesSearch && matchesTags
  })

  const handleAddPlayer = (player: Player) => {
    if (selectedPlayers.length >= 10) {
      toast({
        title: 'エラー',
        description: '最大10人まで選択できます',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setSelectedPlayers([
      ...selectedPlayers,
      {
        player,
        unwantedRoles: player.unwantedRoles || [], // 登録済みの絶対にやりたくないロールを初期選択
      },
    ])
  }

  const handleRemovePlayer = (index: number) => {
    setSelectedPlayers(selectedPlayers.filter((_, i) => i !== index))
  }

  // 絶対にやりたくないロールを追加/削除
  const handleUnwantedRoleToggle = (index: number, role: GameRole) => {
    const newSelectedPlayers = [...selectedPlayers]
    const currentUnwantedRoles = newSelectedPlayers[index].unwantedRoles
    
    if (currentUnwantedRoles.includes(role)) {
      // 絶対にやりたくないロールから削除
      newSelectedPlayers[index].unwantedRoles = currentUnwantedRoles.filter(r => r !== role)
    } else {
      // 絶対にやりたくないロールに追加
      newSelectedPlayers[index].unwantedRoles = [...currentUnwantedRoles, role]
    }
    
    setSelectedPlayers(newSelectedPlayers)
  }

  const calculateTeamRating = (team: { player: Player; role: GameRole }[]) => {
    return Math.round(team.reduce((sum, { player, role }) => {
      return sum + (role === player.mainRole ? player.mainRate : player.subRate)
    }, 0))
  }

  const createTeams = (playersToUse?: SelectedPlayer[]) => {
    const players = playersToUse || selectedPlayers
    
    if (players.length !== 10) {
      toast({
        title: 'エラー',
        description: '10人を選択してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (roleSelectionMode === 'manual') {
      // 手動ロール選択モード：メインロールのレートだけでチーム分け
      const playersWithMainRates = players.map(sp => ({
        ...sp,
        rate: sp.player.mainRate
      }))

      // レート順にソート
      playersWithMainRates.sort((a, b) => b.rate - a.rate)

      // 交互にチームに振り分け
      const blueTeam: { player: Player; role: GameRole }[] = []
      const redTeam: { player: Player; role: GameRole }[] = []

      playersWithMainRates.forEach((playerData, index) => {
        const teamMember = {
          player: playerData.player,
          role: GameRole.TOP // 仮のロール、後で手動で変更
        }

        if (index % 2 === 0) {
          blueTeam.push(teamMember)
        } else {
          redTeam.push(teamMember)
        }
      })

      setTeams({ blue: blueTeam, red: redTeam })
      setIsRoleAssignmentMode(true)
      setIsMatchResultRegistered(false) // 新しいチーム作成時は試合結果未登録状態にリセット
      onOpen() // モーダルを開く
      toast({
        title: 'チーム作成完了',
        description: 'チーム分けが完了しました。ロールを手動で設定してください。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } else {
      // 自動ロール選択モード：やりたくないロールを厳守しつつバランス最適化
      const roles: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]
      const getRateByRole = (player: Player, role: GameRole) =>
        role === player.mainRole ? player.mainRate : player.subRate
      const compareScore = (a: number[], b: number[]) => {
        for (let i = 0; i < a.length; i++) {
          if (a[i] < b[i]) return -1
          if (a[i] > b[i]) return 1
        }
        return 0
      }

      const roleCandidates: Record<GameRole, SelectedPlayer[]> = {
        [GameRole.TOP]: [],
        [GameRole.JUNGLE]: [],
        [GameRole.MID]: [],
        [GameRole.ADC]: [],
        [GameRole.SUP]: [],
      }

      players.forEach((selectedPlayer) => {
        roles.forEach((role) => {
          if (!selectedPlayer.unwantedRoles.includes(role)) {
            roleCandidates[role].push(selectedPlayer)
          }
        })
      })

      // 2チーム分で各ロール2名必要。満たせない場合は自動振り分け不可。
      const insufficientRoles = roles.filter((role) => roleCandidates[role].length < 2)
      if (insufficientRoles.length > 0) {
        toast({
          title: 'チーム分けエラー',
          description: `やりたくないロール設定により ${insufficientRoles.join(', ')} の担当者が不足しています。設定を見直してください。`,
          status: 'error',
          duration: 8000,
          isClosable: true,
        })
        return
      }

      let bestTeams: { blue: { player: Player; role: GameRole }[]; red: { player: Player; role: GameRole }[] } | null = null
      let bestScore: number[] | null = null

      const pairByRole: Partial<Record<GameRole, [SelectedPlayer, SelectedPlayer]>> = {}

      // ロールごとに2名ずつ選び、最後にBLUE/REDの向きを全探索して最良スコアを採用
      const solveByRolePairs = (roleIndex: number, remainingPlayers: SelectedPlayer[]) => {
        if (roleIndex === roles.length) {
          for (let mask = 0; mask < (1 << roles.length); mask++) {
            const blueTeam: { player: Player; role: GameRole }[] = []
            const redTeam: { player: Player; role: GameRole }[] = []

            roles.forEach((role, i) => {
              const pair = pairByRole[role]
              if (!pair) return
              const assignSwapped = (mask & (1 << i)) !== 0
              const bluePlayer = assignSwapped ? pair[1] : pair[0]
              const redPlayer = assignSwapped ? pair[0] : pair[1]
              blueTeam.push({ player: bluePlayer.player, role })
              redTeam.push({ player: redPlayer.player, role })
            })

            if (blueTeam.length !== 5 || redTeam.length !== 5) {
              return
            }

            const roleDiffs = roles.map((role) => {
              const blueMember = blueTeam.find((member) => member.role === role)!
              const redMember = redTeam.find((member) => member.role === role)!
              return Math.abs(
                getRateByRole(blueMember.player, role) - getRateByRole(redMember.player, role)
              )
            })
            const exceedingRolesCount = roleDiffs.filter((diff) => diff > rateDifferenceTolerance).length
            const maxRoleRateDifference = Math.max(...roleDiffs)
            const sumRoleRateDifference = roleDiffs.reduce((sum, diff) => sum + diff, 0)
            const teamRateDifference = Math.abs(calculateTeamRating(blueTeam) - calculateTeamRating(redTeam))
            const currentScore = [
              exceedingRolesCount,
              teamRateDifference,
              sumRoleRateDifference,
              maxRoleRateDifference,
            ]

            if (!bestScore || compareScore(currentScore, bestScore) < 0) {
              bestScore = currentScore
              bestTeams = { blue: blueTeam, red: redTeam }
            }
          }
          return
        }

        const currentRole = roles[roleIndex]
        const candidates = remainingPlayers.filter((player) => !player.unwantedRoles.includes(currentRole))

        for (let i = 0; i < candidates.length; i++) {
          for (let j = i + 1; j < candidates.length; j++) {
            const first = candidates[i]
            const second = candidates[j]
            pairByRole[currentRole] = [first, second]
            const nextRemaining = remainingPlayers.filter(
              (player) => player.player.id !== first.player.id && player.player.id !== second.player.id
            )
            solveByRolePairs(roleIndex + 1, nextRemaining)
            delete pairByRole[currentRole]
          }
        }
      }

      solveByRolePairs(0, players)

      if (!bestTeams) {
        toast({
          title: 'チーム分けエラー',
          description: 'やりたくないロール設定のため、全員を自動で矛盾なく割り当てられませんでした。',
          status: 'error',
          duration: 8000,
          isClosable: true,
        })
        return
      }

      setTeams(bestTeams)
      setIsRoleAssignmentMode(true) // 自動選択でもロール変更可能にする
      setIsMatchResultRegistered(false) // 新しいチーム作成時は試合結果未登録状態にリセット
      onOpen() // モーダルを開く
      toast({
        title: 'チーム作成完了',
        description: 'チーム分けが完了しました。ロールを手動で調整できます。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // チーム再生成用の関数
  const regenerateTeams = () => {
    if (!teams) return
    
    // 現在のチームからselectedPlayersを復元
    const currentTeamPlayers = [
      ...teams.blue.map((t: { player: Player; role: GameRole }) => t.player),
      ...teams.red.map((t: { player: Player; role: GameRole }) => t.player)
    ]
    
    // 重複を除去してselectedPlayersに設定
    const uniquePlayers = currentTeamPlayers.filter((player, index, self) =>
      index === self.findIndex(p => p.id === player.id)
    )
    
    const restoredSelectedPlayers: SelectedPlayer[] = uniquePlayers.map(player => ({
      player,
      unwantedRoles: player.unwantedRoles || []
    }))
    
    setSelectedPlayers(restoredSelectedPlayers)
    
    // 復元したselectedPlayersを直接渡してチーム作成
    createTeams(restoredSelectedPlayers)
  }

  const handleMatchResult = async (winner: 'BLUE' | 'RED') => {
    if (!teams) return

    const match: Omit<Match, 'id'> = {
      date: {
        seconds: Math.floor(new Date().getTime() / 1000),
        nanoseconds: 0
      },
      players: [
        ...teams.blue.map((p) => ({ playerId: p.player.id, role: p.role, team: 'BLUE' as const })),
        ...teams.red.map((p) => ({ playerId: p.player.id, role: p.role, team: 'RED' as const })),
      ],
      winner,
    }

    try {
      const matchRef = await addDoc(collection(db, 'matches'), match)

      // プレイヤーのレートを更新（ローカルとFirebase両方）
      const updatedPlayers = [...players]
      const updatePromises = match.players.map(async ({ playerId, role, team }) => {
        const playerRef = doc(db, 'players', playerId)
        const player = players.find((p) => p.id === playerId)
        if (!player) return

        const isWinner = team === winner
        const rateChange = isWinner ? 50 : -50
        const isMainRole = role === player.mainRole

        // ローカルのプレイヤーリストを即座に更新
        const playerIndex = updatedPlayers.findIndex(p => p.id === playerId)
        if (playerIndex !== -1) {
          updatedPlayers[playerIndex] = {
            ...updatedPlayers[playerIndex],
            [isMainRole ? 'mainRate' : 'subRate']: (isMainRole ? player.mainRate : player.subRate) + rateChange,
            stats: {
              ...updatedPlayers[playerIndex].stats,
              [isWinner ? 'wins' : 'losses']: updatedPlayers[playerIndex].stats[isWinner ? 'wins' : 'losses'] + 1,
            }
          }
        }

        // Firebaseも更新
        await updateDoc(playerRef, {
          [isMainRole ? 'mainRate' : 'subRate']: (isMainRole ? player.mainRate : player.subRate) + rateChange,
          [`stats.${isWinner ? 'wins' : 'losses'}`]: player.stats[isWinner ? 'wins' : 'losses'] + 1,
        })
      })

      // ローカルのプレイヤーリストを即座に更新
      setPlayers(updatedPlayers)

      await Promise.all(updatePromises)

      // teams内のプレイヤー情報も更新して、モーダル内のレート表示を即座に反映
      if (teams) {
        const updatedTeams = {
          blue: teams.blue.map((teamMember) => {
            const updatedPlayer = updatedPlayers.find(p => p.id === teamMember.player.id)
            return updatedPlayer 
              ? { ...teamMember, player: updatedPlayer }
              : teamMember
          }),
          red: teams.red.map((teamMember) => {
            const updatedPlayer = updatedPlayers.find(p => p.id === teamMember.player.id)
            return updatedPlayer 
              ? { ...teamMember, player: updatedPlayer }
              : teamMember
          })
        }
        setTeams(updatedTeams)
      }

      toast({
        title: '成功',
        description: '試合結果を保存しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // チーム構成は保持し、選択されたプレイヤーはリセット
      setSelectedPlayers([])
      setIsMatchResultRegistered(true)
      // setTeams(null) を削除してチーム構成を保持
    } catch (error) {
      console.error('Error saving match:', error)
      toast({
        title: 'エラー',
        description: '試合結果の保存に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }


  const handleSwapPlayers = (team1: 'blue' | 'red', index1: number, team2: 'blue' | 'red', index2: number) => {
    if (!teams) return;

    const newTeams = {
      blue: [...teams.blue],
      red: [...teams.red],
    };

    const temp = newTeams[team1][index1];
    newTeams[team1][index1] = newTeams[team2][index2];
    newTeams[team2][index2] = temp;

    setTeams(newTeams);
  };

  const handleRoleChange = (team: 'blue' | 'red', playerIndex: number, newRole: GameRole) => {
    if (!teams) return;

    const newTeams = {
      blue: [...teams.blue],
      red: [...teams.red],
    };

    newTeams[team][playerIndex] = {
      ...newTeams[team][playerIndex],
      role: newRole
    };

    setTeams(newTeams);
  };

  const getRoleColor = (role: GameRole) => {
    const colors: { [key in GameRole]: string } = {
      [GameRole.TOP]: 'red',
      [GameRole.JUNGLE]: 'green',
      [GameRole.MID]: 'blue',
      [GameRole.ADC]: 'purple',
      [GameRole.SUP]: 'orange'
    }
    return colors[role] || 'gray'
  }

  const calculateAverageRate = (team: { player: Player; role: GameRole }[]) => {
    if (team.length === 0) return 0
    const totalRate = team.reduce((sum, { player, role }) => {
      const rate = role === player.mainRole ? 
        player.mainRate : 
        player.subRate
      return sum + rate
    }, 0)
    return Math.round(totalRate / team.length)
  }

  // 各ロールのレート差を計算する関数
  const calculateRoleRateDifference = (
    teams: { blue: { player: Player; role: GameRole }[]; red: { player: Player; role: GameRole }[] },
    role: GameRole
  ): number => {
    const bluePlayer = teams.blue.find(p => p.role === role)
    const redPlayer = teams.red.find(p => p.role === role)
    
    if (!bluePlayer || !redPlayer) return 0
    
    const blueRate = bluePlayer.role === bluePlayer.player.mainRole 
      ? bluePlayer.player.mainRate 
      : bluePlayer.player.subRate
    const redRate = redPlayer.role === redPlayer.player.mainRole 
      ? redPlayer.player.mainRate 
      : redPlayer.player.subRate
    
    return Math.abs(blueRate - redRate)
  }

  // 許容値を超えているロールを取得する関数
  const getExceedingToleranceRoles = (
    teams: { blue: { player: Player; role: GameRole }[]; red: { player: Player; role: GameRole }[] } | null
  ): GameRole[] => {
    if (!teams) return []
    
    const exceedingRoles: GameRole[] = []
    const roles: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]
    
    roles.forEach(role => {
      const rateDiff = calculateRoleRateDifference(teams, role)
      if (rateDiff > rateDifferenceTolerance) {
        exceedingRoles.push(role)
      }
    })
    
    return exceedingRoles
  }

  return (
    <Layout>
      <VStack spacing={6} align="stretch" pb="120px">
        <Heading textAlign="center" color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
          チームメーカー
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* プレイヤー選択エリア */}
          <Card>
            <CardHeader>
              <Heading size="md" color="gray.700">
                プレイヤー選択
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* 検索バー */}
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="プレイヤー名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="md"
                  />
                </InputGroup>

                {/* タグフィルター */}
                {availableTags.length > 0 && (
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" fontWeight="bold">
                      タグで絞り込み ({selectedTags.length}個選択中)
                    </Text>
                    <CheckboxGroup
                      value={selectedTags}
                      onChange={(values) => setSelectedTags(values as string[])}
                    >
                      <Wrap spacing={2}>
                        {availableTags.map((tag) => (
                          <WrapItem key={tag}>
                            <Checkbox value={tag} colorScheme="blue">
                              <Tag
                                size="md"
                                variant="outline"
                                colorScheme="blue"
                              >
                                <TagLabel>{tag}</TagLabel>
                              </Tag>
                            </Checkbox>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </CheckboxGroup>
                    {selectedTags.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => setSelectedTags([])}
                      >
                        フィルターをクリア
                      </Button>
                    )}
                  </VStack>
                )}

                {/* プレイヤーリスト */}
                <Box maxH="400px" overflowY="auto">
                  <VStack spacing={2} align="stretch">
                    {filteredPlayers.map((player) => {
                      const isSelected = selectedPlayers.some((sp) => sp.player.id === player.id)
                      return (
                        <Card
                          key={player.id}
                          bg={isSelected ? 'blue.50' : 'white'}
                          border="1px solid"
                          borderColor={isSelected ? 'blue.200' : 'gray.200'}
                          cursor={isSelected ? 'not-allowed' : 'pointer'}
                          onClick={() => !isSelected && handleAddPlayer(player)}
                          _hover={!isSelected ? { bg: 'gray.50' } : {}}
                        >
                          <CardBody p={3}>
                            <VStack spacing={2} align="stretch">
                              <HStack justify="space-between">
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">{player.nickname || player.name}</Text>
                                  {player.nickname && (
                                    <Text fontSize="xs" color="gray.500">
                                      {player.name}
                                    </Text>
                                  )}
                                </VStack>
                                <Badge colorScheme={getRoleColor(player.mainRole)}>
                                  {player.mainRole}
                                </Badge>
                              </HStack>
                              <HStack spacing={2} wrap="wrap">
                                <Text fontSize="sm" color="gray.600">
                                  メイン: {player.mainRate}
                                </Text>
                                <Badge colorScheme={getRankColor(getRankFromRate(player.mainRate))} size="sm">
                                  {getRankFromRate(player.mainRate)}
                                </Badge>
                                <Text fontSize="sm" color="gray.600">
                                  サブ: {player.subRate}
                                </Text>
                                <Badge colorScheme={getRankColor(getRankFromRate(player.subRate))} size="sm">
                                  {getRankFromRate(player.subRate)}
                                </Badge>
                              </HStack>
                              {player.tags && player.tags.length > 0 && (
                                <Wrap spacing={1}>
                                  {player.tags.map((tag, index) => (
                                    <WrapItem key={index}>
                                      <Tag size="sm" variant="outline" colorScheme="blue">
                                        <TagLabel>{tag}</TagLabel>
                                      </Tag>
                                    </WrapItem>
                                  ))}
                                </Wrap>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      )
                    })}
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* 選択されたプレイヤーエリア */}
          <Card>
            <CardHeader>
              <Heading size="md" color="gray.700">
                選択されたプレイヤー ({selectedPlayers.length}/10)
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {selectedPlayers.map((selectedPlayer, index) => (
                  <Card key={selectedPlayer.player.id} bg="blue.50">
                    <CardBody p={3}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{selectedPlayer.player.nickname || selectedPlayer.player.name}</Text>
                            {selectedPlayer.player.nickname && (
                              <Text fontSize="xs" color="gray.500">
                                {selectedPlayer.player.name}
                              </Text>
                            )}
                            <HStack spacing={2} wrap="wrap">
                              <Text fontSize="xs" color="gray.600">
                                メイン: {selectedPlayer.player.mainRate}
                              </Text>
                              <Badge colorScheme={getRankColor(getRankFromRate(selectedPlayer.player.mainRate))} size="xs">
                                {getRankFromRate(selectedPlayer.player.mainRate)}
                              </Badge>
                              <Text fontSize="xs" color="gray.600">
                                サブ: {selectedPlayer.player.subRate}
                              </Text>
                              <Badge colorScheme={getRankColor(getRankFromRate(selectedPlayer.player.subRate))} size="xs">
                                {getRankFromRate(selectedPlayer.player.subRate)}
                              </Badge>
                            </HStack>
                          </VStack>
                          <IconButton
                            aria-label="Remove player"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleRemovePlayer(index)}
                          />
                        </HStack>
                        <VStack spacing={3} align="stretch">
                          <Text fontSize="sm" fontWeight="bold" color="red.600">
                            絶対にやりたくないロール
                          </Text>
                          <Wrap spacing={2}>
                            {Object.values(GameRole).map((role) => (
                              <WrapItem key={role}>
                                <Checkbox
                                  isChecked={selectedPlayer.unwantedRoles.includes(role)}
                                  onChange={() => handleUnwantedRoleToggle(index, role)}
                                  colorScheme="red"
                                >
                                  <Tag
                                    size="md"
                                    variant={selectedPlayer.unwantedRoles.includes(role) ? "solid" : "outline"}
                                    colorScheme="red"
                                  >
                                    <TagLabel>{role}</TagLabel>
                                  </Tag>
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </VStack>
                        
                        {selectedPlayer.player.tags && selectedPlayer.player.tags.length > 0 && (
                          <Wrap spacing={1}>
                            {selectedPlayer.player.tags.map((tag, tagIndex) => (
                              <WrapItem key={tagIndex}>
                                <Tag size="sm" variant="outline" colorScheme="blue">
                                  <TagLabel>{tag}</TagLabel>
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}

                {selectedPlayers.length === 0 && (
                  <Text textAlign="center" color="gray.500">
                    プレイヤーを選択してください
                  </Text>
                )}

                {selectedPlayers.length >= 10 && (
                  <Text textAlign="center" color="red.500" fontWeight="bold">
                    最大10人まで選択できます
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>


        {/* フッター追従メニュー */}
        <Box
          position="fixed"
          bottom="0"
          left="0"
          right="0"
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          p={3}
          zIndex={1000}
          boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
        >
          <Container maxW="container.xl">
            <Flex 
              align="center" 
              gap={3}
              direction={{ base: 'column', md: 'row' }}
            >
              <VStack spacing={1} align={{ base: 'center', md: 'start' }}>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  選択されたプレイヤー: {selectedPlayers.length}/10人
                </Text>
                <RadioGroup
                  value={roleSelectionMode}
                  onChange={(value) => setRoleSelectionMode(value as RoleSelectionMode)}
                >
                  <HStack spacing={3} wrap="wrap" justify={{ base: 'center', md: 'start' }}>
                    <Radio value="auto" size="sm">
                      <Text fontSize="xs">ロール自動選択</Text>
                    </Radio>
                    <Radio value="manual" size="sm">
                      <Text fontSize="xs">ロール手動選択</Text>
                    </Radio>
                  </HStack>
                </RadioGroup>
                <HStack spacing={2} align="center">
                  <Text fontSize="xs" color="gray.600">
                    レート差許容値:
                  </Text>
                  <Input
                    type="number"
                    value={rateDifferenceTolerance}
                    onChange={(e) => setRateDifferenceTolerance(Number(e.target.value) || 0)}
                    size="xs"
                    width="60px"
                    min={0}
                    max={1000}
                  />
                  <Text fontSize="xs" color="gray.600">
                    以下
                  </Text>
                </HStack>
              </VStack>
              <Spacer display={{ base: 'none', md: 'block' }} />
              <HStack spacing={2}>
                {teams && (
                  <Button
                    colorScheme="purple"
                    onClick={onOpen}
                    size="md"
                    variant="outline"
                  >
                    チーム表示
                  </Button>
                )}
                <Button
                  colorScheme="blue"
                  onClick={() => createTeams()}
                  isDisabled={selectedPlayers.length < 10}
                  size="md"
                  minW={{ base: '100%', md: '180px' }}
                >
                  チーム作成
                </Button>
              </HStack>
            </Flex>
          </Container>
        </Box>

        {/* チーム表示モーダル */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent maxW="90vw" maxH="90vh">
            <ModalHeader>
              <HStack justify="space-between" align="center">
                <Text>チーム構成</Text>
                <HStack spacing={2}>
                  <Button
                    leftIcon={<RepeatIcon />}
                    colorScheme="green"
                    onClick={() => {
                      if (!isMatchResultRegistered && window.confirm('試合結果を登録していませんが、チームを再生成しますか？')) {
                        regenerateTeams()
                      } else if (isMatchResultRegistered) {
                        regenerateTeams()
                      }
                    }}
                    size="sm"
                  >
                    チーム再生成
                  </Button>
                </HStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {teams && (
                <VStack spacing={6} align="stretch">
                  {/* レート差警告メッセージ */}
                  {(() => {
                    const exceedingRoles = getExceedingToleranceRoles(teams)
                    if (exceedingRoles.length > 0) {
                      return (
                        <Card bg="orange.50" borderColor="orange.300" borderWidth="2px">
                          <CardBody>
                            <VStack spacing={2} align="stretch">
                              <HStack>
                                <Text fontWeight="bold" color="orange.700" fontSize="md">
                                  警告: レート差が許容値を超えています
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color="orange.700">
                                以下のロールでレート差が許容値（{rateDifferenceTolerance}）を超えています。プレイヤーの入れ替えやロール変更を検討してください。
                              </Text>
                              <Wrap spacing={2}>
                                {exceedingRoles.map(role => {
                                  const rateDiff = calculateRoleRateDifference(teams, role)
                                  const bluePlayer = teams.blue.find(p => p.role === role)
                                  const redPlayer = teams.red.find(p => p.role === role)
                                  const blueRate = bluePlayer && bluePlayer.role === bluePlayer.player.mainRole 
                                    ? bluePlayer.player.mainRate 
                                    : bluePlayer?.player.subRate || 0
                                  const redRate = redPlayer && redPlayer.role === redPlayer.player.mainRole 
                                    ? redPlayer.player.mainRate 
                                    : redPlayer?.player.subRate || 0
                                  return (
                                    <WrapItem key={role}>
                                      <Tag size="md" colorScheme="orange" variant="solid">
                                        <TagLabel>
                                          {role}: {Math.min(blueRate, redRate)} vs {Math.max(blueRate, redRate)} (差: {rateDiff})
                                        </TagLabel>
                                      </Tag>
                                    </WrapItem>
                                  )
                                })}
                              </Wrap>
                            </VStack>
                          </CardBody>
                        </Card>
                      )
                    }
                    return null
                  })()}
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {[
                      { team: teams.blue, name: 'チーム1', color: 'blue' },
                      { team: teams.red, name: 'チーム2', color: 'red' },
                    ].map(({ team, name, color }) => (
                      <Card key={name}>
                        <VStack align="stretch" spacing={4}>
                          <Heading size="md" color={`${color}.600`}>
                            {name}
                          </Heading>
                          <Text fontSize="sm" color="gray.600" mb={2}>
                            {isRoleAssignmentMode 
                              ? 'プレイヤーをクリックするとロールとチームを変更できます。'
                              : 'プレイヤーをクリックするとロールとチームを変更できます。'
                            }
                          </Text>
                          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                            {team.map((player, teamIndex) => {
                              const exceedingRoles = getExceedingToleranceRoles(teams)
                              const isExceeding = exceedingRoles.includes(player.role)
                              return (
                              <Card
                                key={player.player.id}
                                bg={isExceeding ? 'orange.100' : useColorModeValue('gray.50', 'gray.700')}
                                borderWidth={isExceeding ? "2px" : "1px"}
                                borderColor={isExceeding ? "orange.400" : undefined}
                              >
                                <Menu>
                                  <MenuButton as={Box} cursor="pointer" w="100%" h="100%">
                                    <VStack align="stretch" spacing={1}>
                                      <VStack align="start" spacing={0}>
                                        <Text fontWeight="bold">{player.player.nickname || player.player.name}</Text>
                                        {player.player.nickname && (
                                          <Text fontSize="xs" color="gray.500">
                                            {player.player.name}
                                          </Text>
                                        )}
                                      </VStack>
                                      <Badge
                                        colorScheme={getRoleColor(player.role)}
                                      >
                                        {player.role}
                                      </Badge>
                                      <VStack spacing={1} align="stretch">
                                        <Text fontSize="sm" color="gray.500">
                                          レート: {player.role === player.player.mainRole ? player.player.mainRate : player.player.subRate}
                                        </Text>
                                        <Badge 
                                          colorScheme={getRankColor(getRankFromRate(player.role === player.player.mainRole ? player.player.mainRate : player.player.subRate))} 
                                          size="sm"
                                          alignSelf="center"
                                        >
                                          {getRankFromRate(player.role === player.player.mainRole ? player.player.mainRate : player.player.subRate)}
                                        </Badge>
                                        {isExceeding && (
                                          <Text fontSize="xs" color="orange.600" fontWeight="bold" textAlign="center" mt={1}>
                                            レート差超過
                                          </Text>
                                        )}
                                      </VStack>
                                    </VStack>
                                  </MenuButton>
                                  <MenuList>
                                    <HStack align="start" spacing={0}>
                                      {isRoleAssignmentMode && (
                                        <Box flex="1" borderRight="1px solid" borderColor="gray.200">
                                          <MenuGroup title="ロール変更">
                                            <Box p={2}>
                                              <VStack spacing={1} align="stretch">
                                                {Object.values(GameRole).map((role) => {
                                                  const currentRate = player.role === player.player.mainRole ? 
                                                    player.player.mainRate : 
                                                    player.player.subRate
                                                  const newRate = role === player.player.mainRole ? 
                                                    player.player.mainRate : 
                                                    player.player.subRate
                                                  const diff = newRate - currentRate
                                                  
                                                  return (
                                                    <MenuItem
                                                      key={role}
                                                      onClick={() => {
                                                        const currentTeamKey = name === 'チーム1' ? 'blue' : 'red'
                                                        handleRoleChange(currentTeamKey, teamIndex, role)
                                                      }}
                                                      isDisabled={player.role === role}
                                                      minH="auto"
                                                      py={2}
                                                    >
                                                      <HStack justify="space-between" w="100%">
                                                        <VStack align="start" spacing={0}>
                                                          <Text fontSize="sm" fontWeight="bold">
                                                            {role}
                                                          </Text>
                                                          <Text fontSize="xs" color="gray.500">
                                                            レート: {newRate}
                                                          </Text>
                                                        </VStack>
                                                        {diff !== 0 && (
                                                          <Text fontSize="xs" color={diff > 0 ? 'green.500' : 'red.500'}>
                                                            {diff > 0 ? '+' : ''}{diff}
                                                          </Text>
                                                        )}
                                                      </HStack>
                                                    </MenuItem>
                                                  )
                                                })}
                                              </VStack>
                                            </Box>
                                          </MenuGroup>
                                        </Box>
                                      )}
                                      <Box flex="1">
                                        <MenuGroup title={`${name === 'チーム1' ? 'チーム2' : 'チーム1'}と交代`}>
                                          <Box p={2}>
                                            <VStack spacing={1} align="stretch">
                                              {(name === 'チーム1' ? teams.red : teams.blue).map((otherPlayer, otherIndex) => (
                                                <MenuItem
                                                  key={otherPlayer.player.id}
                                                  onClick={() => {
                                                    const otherTeamKey = name === 'チーム1' ? 'red' : 'blue'
                                                    const currentTeamKey = name === 'チーム1' ? 'blue' : 'red'
                                                    handleSwapPlayers(currentTeamKey, teamIndex, otherTeamKey, otherIndex)
                                                  }}
                                                  minH="auto"
                                                  py={2}
                                                >
                                                  <HStack justify="space-between" w="100%">
                                                    <VStack align="start" spacing={0}>
                                                      <Text fontSize="sm" fontWeight="bold">
                                                        {otherPlayer.player.nickname || otherPlayer.player.name}
                                                      </Text>
                                                      {otherPlayer.player.nickname && (
                                                        <Text fontSize="xs" color="gray.400">
                                                          {otherPlayer.player.name}
                                                        </Text>
                                                      )}
                                                      <Text fontSize="xs" color="gray.500">
                                                        {otherPlayer.role}
                                                      </Text>
                                                    </VStack>
                                                    {(() => {
                                                      const currentRate = player.role === player.player.mainRole ? 
                                                        player.player.mainRate : 
                                                        player.player.subRate
                                                      const otherRate = otherPlayer.role === otherPlayer.player.mainRole ? 
                                                        otherPlayer.player.mainRate : 
                                                        otherPlayer.player.subRate
                                                      const diff = otherRate - currentRate
                                                      return (
                                                        <Text fontSize="xs" color={diff > 0 ? 'green.500' : diff < 0 ? 'red.500' : 'gray.500'}>
                                                          {diff > 0 ? '+' : ''}{diff}
                                                        </Text>
                                                      )
                                                    })()}
                                                  </HStack>
                                                </MenuItem>
                                              ))}
                                            </VStack>
                                          </Box>
                                        </MenuGroup>
                                      </Box>
                                    </HStack>
                                  </MenuList>
                                </Menu>
                              </Card>
                            )})}
                          </SimpleGrid>
                          <Divider />
                          <HStack justify="space-between">
                            <Text fontWeight="bold">平均レート:</Text>
                            <Text>{calculateAverageRate(team)}</Text>
                          </HStack>
                        </VStack>
                      </Card>
                    ))}
                  </SimpleGrid>

                  <Card>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" color="gray.700" textAlign="center">
                        試合結果
                      </Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Button
                          colorScheme="blue"
                          onClick={() => handleMatchResult('BLUE')}
                          size="lg"
                          width="100%"
                        >
                          チーム1の勝利
                        </Button>
                        <Button
                          colorScheme="red"
                          onClick={() => handleMatchResult('RED')}
                          size="lg"
                          width="100%"
                        >
                          チーム2の勝利
                        </Button>
                      </SimpleGrid>
                      <Button
                        colorScheme="purple"
                        as="a"
                        href="https://draftlol.dawe.gg/"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="lg"
                        width="100%"
                      >
                        ドラフトツール
                      </Button>
                    </VStack>
                  </Card>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Layout>
  )
} 