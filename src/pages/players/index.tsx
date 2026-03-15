import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Text,
  Tag,
  TagLabel,
  Select,
  Flex,
  Wrap,
  WrapItem,
  useToast,
  TagCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  FormControl,
  FormLabel,
  Card as ChakraCard,
  CardBody,
  CardHeader,
} from '@chakra-ui/react'
import { SearchIcon, AddIcon, EditIcon, CheckIcon, CloseIcon, DeleteIcon, TimeIcon } from '@chakra-ui/icons'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player, GameRole, RANK_RATES, Rank, Match } from '@/types'
import Layout from '@/components/Layout'
import Card from '@/components/Card'
import Link from 'next/link'

// 利用可能なタグオプション（Ahri class専用）
const AVAILABLE_TAGS = ['アーリ組', 'その他']

interface EditingState {
  id: string | null;
  newName: string;
}


interface EditingUnwantedRoles {
  id: string;
  unwantedRoles: GameRole[];
}

export default function Players() {
  const [players, setPlayers] = useState<(Player & { id: string })[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editing, setEditing] = useState<{ id: string; newName: string } | null>(null)
  const [editingTags, setEditingTags] = useState<{ id: string; tags: string[] } | null>(null)
  const [editingUnwantedRoles, setEditingUnwantedRoles] = useState<EditingUnwantedRoles | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [rateModalPlayer, setRateModalPlayer] = useState<(Player & { id: string }) | null>(null)
  const [tempMainRate, setTempMainRate] = useState(0)
  const [tempSubRate, setTempSubRate] = useState(0)
  const { isOpen: isRateModalOpen, onOpen: onRateModalOpen, onClose: onRateModalClose } = useDisclosure()
  
  // 統合編集モーダルの状態
  const [editModalPlayer, setEditModalPlayer] = useState<(Player & { id: string }) | null>(null)
  const [tempEditName, setTempEditName] = useState('')
  const [tempEditNickname, setTempEditNickname] = useState('')
  const [tempEditMainRate, setTempEditMainRate] = useState(0)
  const [tempEditSubRate, setTempEditSubRate] = useState(0)
  const [tempEditTags, setTempEditTags] = useState<string[]>([])
  const [tempEditUnwantedRoles, setTempEditUnwantedRoles] = useState<GameRole[]>([])
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure()
  const [showRankReference, setShowRankReference] = useState(false)
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const toast = useToast()

  // 履歴モーダルの状態
  const [historyModalPlayer, setHistoryModalPlayer] = useState<(Player & { id: string }) | null>(null)
  const [playerMatches, setPlayerMatches] = useState<Array<Match & { playerTeam: 'BLUE' | 'RED', playerRole: string, isWinner: boolean }>>([])
  const { isOpen: isHistoryModalOpen, onOpen: onHistoryModalOpen, onClose: onHistoryModalClose } = useDisclosure()

  const fetchPlayers = async () => {
    const querySnapshot = await getDocs(collection(db, 'players'))
    const playersData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Player & { id: string })[]
    setPlayers(playersData)
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  const getRoleColor = (role: GameRole) => {
    const colors = {
      TOP: 'red',
      JUNGLE: 'green',
      MID: 'blue',
      ADC: 'purple',
      SUP: 'orange'
    }
    return colors[role]
  }

  const handleEditClick = (player: Player & { id: string }) => {
    setEditing({ 
      id: player.id, 
      newName: player.name
    })
  }

  const handleCancelEdit = () => {
    setEditing(null)
  }

  const handleSaveEdit = async (playerId: string) => {
    if (!editing?.newName.trim()) {
      toast({
        title: 'エラー',
        description: '名前を入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const playerRef = doc(db, 'players', playerId)
      await updateDoc(playerRef, {
        name: editing.newName.trim()
      })

      setPlayers(players.map(p => 
        p.id === playerId 
          ? { ...p, name: editing.newName.trim() }
          : p
      ))

      setEditing(null)

      toast({
        title: '更新完了',
        description: 'プレイヤー名を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'エラー',
        description: '更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // タグを追加
  const addTag = (playerId: string) => {
    if (tagInput.trim() && editingTags && !editingTags.tags.includes(tagInput.trim())) {
      setEditingTags({
        ...editingTags,
        tags: [...editingTags.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  // タグを削除
  const removeTag = (playerId: string, tagToRemove: string) => {
    if (editingTags) {
      setEditingTags({
        ...editingTags,
        tags: editingTags.tags.filter(tag => tag !== tagToRemove)
      })
    }
  }

  // タグ編集を開始
  const handleEditTagsClick = (player: Player & { id: string }) => {
    setEditingTags({
      id: player.id,
      tags: player.tags || []
    })
  }

  // タグ編集を保存
  const handleSaveTags = async (playerId: string) => {
    if (!editingTags) return

    try {
      const playerRef = doc(db, 'players', playerId)
      await updateDoc(playerRef, {
        tags: editingTags.tags.length > 0 ? editingTags.tags : null
      })

      // プレイヤーリストを更新
      setPlayers(players.map(player => 
        player.id === playerId 
          ? { ...player, tags: editingTags.tags.length > 0 ? editingTags.tags : undefined }
          : player
      ))

      setEditingTags(null)
      toast({
        title: '成功',
        description: 'タグを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error updating tags:', error)
      toast({
        title: 'エラー',
        description: 'タグの更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // タグ編集をキャンセル
  const handleCancelTags = () => {
    setEditingTags(null)
    setTagInput('')
  }

  const handleEditRatesClick = (player: Player & { id: string }) => {
    setRateModalPlayer(player)
    setTempMainRate(player.mainRate)
    setTempSubRate(player.subRate)
    onRateModalOpen()
  }


  const handleSaveRatesModal = async () => {
    if (!rateModalPlayer) return

    try {
      const playerRef = doc(db, 'players', rateModalPlayer.id)
      await updateDoc(playerRef, {
        mainRate: tempMainRate,
        subRate: tempSubRate
      })

      // プレイヤーリストを更新
      setPlayers(players.map(player => 
        player.id === rateModalPlayer.id 
          ? { ...player, mainRate: tempMainRate, subRate: tempSubRate }
          : player
      ))

      onRateModalClose()
      setRateModalPlayer(null)
      toast({
        title: '成功',
        description: 'レートを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error updating rates:', error)
      toast({
        title: 'エラー',
        description: 'レートの更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleCancelRatesModal = () => {
    onRateModalClose()
    setRateModalPlayer(null)
  }

  // プレイヤー削除関数
  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!window.confirm(`プレイヤー「${playerName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return
    }

    try {
      const playerRef = doc(db, 'players', playerId)
      await deleteDoc(playerRef)

      // プレイヤーリストから削除
      setPlayers(players.filter(p => p.id !== playerId))

      toast({
        title: '削除完了',
        description: `プレイヤー「${playerName}」を削除しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error deleting player:', error)
      toast({
        title: 'エラー',
        description: 'プレイヤーの削除に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }


  // 絶対にやりたくないロール編集を開始
  const handleEditUnwantedRolesClick = (player: Player & { id: string }) => {
    setEditingUnwantedRoles({
      id: player.id,
      unwantedRoles: player.unwantedRoles || []
    })
  }

  // 絶対にやりたくないロール編集を保存
  const handleSaveUnwantedRoles = async (playerId: string) => {
    if (!editingUnwantedRoles) return

    try {
      const playerRef = doc(db, 'players', playerId)
      await updateDoc(playerRef, {
        unwantedRoles: editingUnwantedRoles.unwantedRoles.length > 0 ? editingUnwantedRoles.unwantedRoles : null
      })

      // プレイヤーリストを更新
      setPlayers(players.map(player => 
        player.id === playerId 
          ? { ...player, unwantedRoles: editingUnwantedRoles.unwantedRoles.length > 0 ? editingUnwantedRoles.unwantedRoles : undefined }
          : player
      ))

      setEditingUnwantedRoles(null)
      toast({
        title: '成功',
        description: '絶対にやりたくないロールを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error updating unwanted roles:', error)
      toast({
        title: 'エラー',
        description: '絶対にやりたくないロールの更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // 絶対にやりたくないロール編集をキャンセル
  const handleCancelUnwantedRoles = () => {
    setEditingUnwantedRoles(null)
  }

  // 絶対にやりたくないロールの選択/解除
  const handleUnwantedRoleToggle = (role: GameRole) => {
    if (editingUnwantedRoles) {
      const currentRoles = editingUnwantedRoles.unwantedRoles
      if (currentRoles.includes(role)) {
        setEditingUnwantedRoles({
          ...editingUnwantedRoles,
          unwantedRoles: currentRoles.filter(r => r !== role)
        })
      } else {
        setEditingUnwantedRoles({
          ...editingUnwantedRoles,
          unwantedRoles: [...currentRoles, role]
        })
      }
    }
  }




  // 統合編集モーダルを開く
  const handleEditPlayerClick = (player: Player & { id: string }) => {
    setEditModalPlayer(player)
    setTempEditName(player.name)
    setTempEditNickname(player.nickname || '')
    setTempEditMainRate(player.mainRate)
    setTempEditSubRate(player.subRate)
    setTempEditTags(player.tags || [])
    setTempEditUnwantedRoles(player.unwantedRoles || [])
    onEditModalOpen()
  }

  // 統合編集モーダルを保存
  const handleSaveEditModal = async () => {
    if (!editModalPlayer) return

    try {
      const playerRef = doc(db, 'players', editModalPlayer.id)
      await updateDoc(playerRef, {
        name: tempEditName,
        nickname: tempEditNickname.trim() || null,
        mainRate: tempEditMainRate,
        subRate: tempEditSubRate,
        tags: tempEditTags,
        unwantedRoles: tempEditUnwantedRoles
      })

      // ローカルのプレイヤーリストを更新
      setPlayers(players.map(player => 
        player.id === editModalPlayer.id 
          ? { 
              ...player, 
              name: tempEditName,
              nickname: tempEditNickname.trim() || undefined,
              mainRate: tempEditMainRate,
              subRate: tempEditSubRate,
              tags: tempEditTags,
              unwantedRoles: tempEditUnwantedRoles
            }
          : player
      ))

      toast({
        title: '更新完了',
        description: 'プレイヤー情報を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      onEditModalClose()
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: '更新エラー',
        description: 'プレイヤー情報の更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // 統合編集モーダルをキャンセル
  const handleCancelEditModal = () => {
    setEditModalPlayer(null)
    setTempEditName('')
    setTempEditNickname('')
    setTempEditMainRate(0)
    setTempEditSubRate(0)
    setTempEditTags([])
    setTempEditUnwantedRoles([])
    onEditModalClose()
  }

  // 履歴モーダルを開く
  const handleViewHistoryClick = async (player: Player & { id: string }) => {
    setHistoryModalPlayer(player)
    
    try {
      // 試合情報を取得
      const matchesSnapshot = await getDocs(
        query(collection(db, 'matches'), orderBy('date', 'desc'))
      )
      
      // このプレイヤーが参加した試合をフィルタリング
      const matches = matchesSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Match))
        .filter((match) => 
          match.players.some((p) => p.playerId === player.id)
        )
        .map((match) => {
          const playerInMatch = match.players.find((p) => p.playerId === player.id)!
          return {
            ...match,
            playerTeam: playerInMatch.team,
            playerRole: playerInMatch.role,
            isWinner: playerInMatch.team === match.winner,
          }
        })
      
      setPlayerMatches(matches)
      onHistoryModalOpen()
    } catch (error) {
      console.error('Error fetching match history:', error)
      toast({
        title: 'エラー',
        description: '試合履歴の取得に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // 履歴モーダルを閉じる
  const handleCloseHistoryModal = () => {
    setHistoryModalPlayer(null)
    setPlayerMatches([])
    onHistoryModalClose()
  }

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

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
            『プレイヤー』一覧
          </Heading>
          <HStack spacing={3}>
            <Link href="/players/new" passHref>
              <Button
                as="a"
                colorScheme="blue"
                size="md"
                leftIcon={<AddIcon />}
                boxShadow="md"
                _hover={{ 
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg'
                }}
              >
                新規登録
              </Button>
            </Link>
          </HStack>
        </HStack>

        <Card>
          <Box p={4}>
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
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    タグで絞り込み:
                  </Text>
                  <Wrap spacing={2}>
                    {availableTags.map((tag) => (
                      <WrapItem key={tag}>
                        <Tag
                          size="md"
                          variant={selectedTags.includes(tag) ? "solid" : "outline"}
                          colorScheme={selectedTags.includes(tag) ? "blue" : "gray"}
                          cursor="pointer"
                          onClick={() => {
                            if (selectedTags.includes(tag)) {
                              setSelectedTags(selectedTags.filter(t => t !== tag))
                            } else {
                              setSelectedTags([...selectedTags, tag])
                            }
                          }}
                          _hover={{ opacity: 0.8 }}
                        >
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                  {selectedTags.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                      onClick={() => setSelectedTags([])}
                      mt={2}
                    >
                      フィルターをクリア
                    </Button>
                  )}
                </Box>
              )}
            </VStack>
          </Box>

          <Box overflowX="auto">
            <Table variant="simple" size="sm" minW="1200px">
              <Thead bg="gray.50">
                <Tr>
                  <Th borderColor={borderColor}>名前</Th>
                  <Th borderColor={borderColor}>メインロール</Th>
                  <Th borderColor={borderColor}>タグ</Th>
                  <Th borderColor={borderColor}>絶対にやりたくないロール</Th>
                  <Th borderColor={borderColor} isNumeric>勝率</Th>
                  <Th borderColor={borderColor} isNumeric>メインロールレート</Th>
                  <Th borderColor={borderColor} isNumeric>サブロールレート</Th>
                  <Th borderColor={borderColor} width="120px"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredPlayers.map((player) => {
                  const winRate = player.stats.wins + player.stats.losses > 0
                    ? Math.round((player.stats.wins / (player.stats.wins + player.stats.losses)) * 100)
                    : 0

                  const isEditing = editing?.id === player.id
                  const isEditingTags = editingTags?.id === player.id
                  const isEditingUnwantedRoles = editingUnwantedRoles?.id === player.id

                  return (
                    <Tr 
                      key={player.id}
                      _hover={{ bg: 'gray.50' }}
                      transition="background-color 0.2s"
                    >
                      <Td borderColor={borderColor}>
                        {isEditing ? (
                          <Input
                            value={editing.newName}
                            onChange={(e) => setEditing({ ...editing, newName: e.target.value })}
                            size="sm"
                            width="200px"
                          />
                        ) : (
                          player.nickname || player.name
                        )}
                      </Td>
                      <Td borderColor={borderColor}>
                        <Badge 
                          colorScheme={getRoleColor(player.mainRole)}
                          fontSize="sm"
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          {player.mainRole}
                        </Badge>
                      </Td>
                      <Td borderColor={borderColor}>
                        {isEditingTags ? (
                          <VStack spacing={2} align="stretch">
                            <Wrap spacing={2}>
                              {AVAILABLE_TAGS.map((tag) => (
                                <WrapItem key={tag}>
                                  <Checkbox
                                    isChecked={editingTags.tags.includes(tag)}
                                    onChange={() => {
                                      if (editingTags.tags.includes(tag)) {
                                        removeTag(player.id, tag)
                                      } else {
                                        setEditingTags({
                                          ...editingTags,
                                          tags: [...editingTags.tags, tag]
                                        })
                                      }
                                    }}
                                    colorScheme="blue"
                                    size="sm"
                                  >
                                    <Tag
                                      size="sm"
                                      variant={editingTags.tags.includes(tag) ? "solid" : "outline"}
                                      colorScheme="blue"
                                    >
                                      <TagLabel>{tag}</TagLabel>
                                    </Tag>
                                  </Checkbox>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </VStack>
                        ) : (
                          <Wrap spacing={1}>
                            {player.tags?.map((tag, index) => (
                              <WrapItem key={index}>
                                <Tag
                                  size="sm"
                                  variant="outline"
                                  colorScheme="blue"
                                  cursor="pointer"
                                  onClick={() => {
                                    if (!selectedTags.includes(tag)) {
                                      setSelectedTags([...selectedTags, tag])
                                    }
                                  }}
                                  _hover={{ opacity: 0.8 }}
                                >
                                  <TagLabel>{tag}</TagLabel>
                                </Tag>
                              </WrapItem>
                            )) || (
                              <Text fontSize="sm" color="gray.400">
                                タグなし
                              </Text>
                            )}
                          </Wrap>
                        )}
                      </Td>
                      <Td borderColor={borderColor}>
                        {isEditingUnwantedRoles ? (
                          <VStack spacing={2} align="stretch">
                            <Wrap spacing={2}>
                              {Object.values(GameRole).map((role) => (
                                <WrapItem key={role}>
                                  <Checkbox
                                    isChecked={editingUnwantedRoles.unwantedRoles.includes(role)}
                                    onChange={() => handleUnwantedRoleToggle(role)}
                                    colorScheme="red"
                                    size="sm"
                                  >
                                    <Tag
                                      size="sm"
                                      variant={editingUnwantedRoles.unwantedRoles.includes(role) ? "solid" : "outline"}
                                      colorScheme="red"
                                    >
                                      <TagLabel>{role}</TagLabel>
                                    </Tag>
                                  </Checkbox>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </VStack>
                        ) : (
                          <Wrap spacing={1}>
                            {player.unwantedRoles?.map((role, index) => (
                              <WrapItem key={index}>
                                <Tag
                                  size="sm"
                                  variant="outline"
                                  colorScheme="red"
                                >
                                  <TagLabel>{role}</TagLabel>
                                </Tag>
                              </WrapItem>
                            )) || (
                              <Text fontSize="sm" color="gray.400">
                                なし
                              </Text>
                            )}
                          </Wrap>
                        )}
                      </Td>
                      <Td borderColor={borderColor} isNumeric>
                        <Text 
                          color={winRate >= 50 ? 'green.500' : 'red.500'}
                          fontWeight="bold"
                        >
                          {winRate}%
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          ({player.stats.wins}勝{player.stats.losses}敗)
                        </Text>
                      </Td>
                      {/* メインロールレート */}
                      <Td borderColor={borderColor} isNumeric>
                        <Text fontWeight="bold" color="blue.600">
                          {player.mainRate}
                        </Text>
                      </Td>
                      {/* サブロールレート */}
                      <Td borderColor={borderColor} isNumeric>
                        <Text fontWeight="bold" color="gray.600">
                          {player.subRate}
                        </Text>
                      </Td>
                      <Td borderColor={borderColor}>
                        <HStack spacing={2} justify="flex-end">
                          {isEditing ? (
                            <>
                              <IconButton
                                aria-label="Save"
                                icon={<CheckIcon />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleSaveEdit(player.id)}
                              />
                              <IconButton
                                aria-label="Cancel"
                                icon={<CloseIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleCancelEdit}
                              />
                            </>
                          ) : isEditingTags ? (
                            <>
                              <IconButton
                                aria-label="Save tags"
                                icon={<CheckIcon />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleSaveTags(player.id)}
                              />
                              <IconButton
                                aria-label="Cancel tags"
                                icon={<CloseIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleCancelTags}
                              />
                            </>
                          ) : isEditingUnwantedRoles ? (
                            <>
                              <IconButton
                                aria-label="Save unwanted roles"
                                icon={<CheckIcon />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleSaveUnwantedRoles(player.id)}
                              />
                              <IconButton
                                aria-label="Cancel unwanted roles"
                                icon={<CloseIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleCancelUnwantedRoles}
                              />
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                colorScheme="purple"
                                onClick={() => handleViewHistoryClick(player)}
                                leftIcon={<TimeIcon />}
                                variant="outline"
                              >
                                履歴
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => handleEditPlayerClick(player)}
                                leftIcon={<EditIcon />}
                              >
                                編集
                              </Button>
                              <IconButton
                                aria-label="Delete player"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleDeletePlayer(player.id, player.name)}
                              />
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        </Card>

        <Text fontSize="sm" color="gray.600" textAlign="center">
          ※プレイヤーの削除が必要な場合は、Discordで「こにー」までご連絡ください。
        </Text>

        {/* レート編集モーダル */}
        <Modal isOpen={isRateModalOpen} onClose={handleCancelRatesModal} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {rateModalPlayer?.name} のレート編集
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                {/* 現在のレート表示 */}
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>現在のレート</Text>
                  <HStack spacing={4}>
                    <Text>メインロール: <Text as="span" fontWeight="bold" color="blue.600">{rateModalPlayer?.mainRate}</Text></Text>
                    <Text>サブロール: <Text as="span" fontWeight="bold" color="gray.600">{rateModalPlayer?.subRate}</Text></Text>
                  </HStack>
                </Box>

                {/* レート入力フォーム */}
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel>メインロールレート</FormLabel>
                    <NumberInput
                      value={tempMainRate}
                      onChange={(_, value) => setTempMainRate(value)}
                      min={0}
                      max={5000}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>サブロールレート</FormLabel>
                    <NumberInput
                      value={tempSubRate}
                      onChange={(_, value) => setTempSubRate(value)}
                      min={0}
                      max={5000}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>

                {/* ランク参考表 */}
                <Box p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" mb={3}>ランク参考表</Text>
                  <SimpleGrid columns={2} spacing={2}>
                    {Object.entries(RANK_RATES).map(([rank, rates]) => (
                      <Box key={rank} p={2} bg="white" borderRadius="sm" border="1px solid" borderColor="gray.200">
                        <Text fontSize="xs" fontWeight="bold" color="blue.600">{rank}</Text>
                        <Text fontSize="xs">メイン: {rates.main} | サブ: {rates.sub}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCancelRatesModal}>
                キャンセル
              </Button>
              <Button colorScheme="blue" onClick={handleSaveRatesModal}>
                保存
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 統合編集モーダル */}
        <Modal isOpen={isEditModalOpen} onClose={handleCancelEditModal} size="2xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {editModalPlayer?.name} の編集
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                {/* 名前編集 */}
                <FormControl>
                  <FormLabel>サモナーネーム</FormLabel>
                  <Input
                    value={tempEditName}
                    onChange={(e) => setTempEditName(e.target.value)}
                    placeholder="サモナーネームを入力"
                  />
                </FormControl>

                {/* ニックネーム編集 */}
                <FormControl>
                  <FormLabel>ニックネーム（Discord表示名）</FormLabel>
                  <Input
                    value={tempEditNickname}
                    onChange={(e) => setTempEditNickname(e.target.value)}
                    placeholder="ニックネームを入力（任意）"
                  />
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    プレイヤー一覧で優先的に表示されます
                  </Text>
                </FormControl>

                {/* レート編集 */}
                <Box>
                  <HStack justify="space-between" align="center" mb={3}>
                    <Text fontSize="lg" fontWeight="bold">レート設定</Text>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => setShowRankReference(!showRankReference)}
                    >
                      {showRankReference ? 'ランク参考を閉じる' : 'ランク参考'}
                    </Button>
                  </HStack>
                  
                  {showRankReference && (
                    <Box p={4} bg="blue.50" borderRadius="md" mb={4}>
                      <Text fontSize="sm" fontWeight="bold" mb={3}>ランク参考表</Text>
                      <SimpleGrid columns={2} spacing={2}>
                        {Object.entries(RANK_RATES).map(([rank, rates]) => (
                          <Box key={rank} p={2} bg="white" borderRadius="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xs" fontWeight="bold" color="blue.600">{rank}</Text>
                            <Text fontSize="xs">メイン: {rates.main} | サブ: {rates.sub}</Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel>メインロールレート</FormLabel>
                      <NumberInput
                        value={tempEditMainRate}
                        onChange={(_, value) => setTempEditMainRate(value)}
                        min={0}
                        max={5000}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>サブロールレート</FormLabel>
                      <NumberInput
                        value={tempEditSubRate}
                        onChange={(_, value) => setTempEditSubRate(value)}
                        min={0}
                        max={5000}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* タグ編集 */}
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>タグ設定</Text>
                  <VStack spacing={3} align="stretch">
                    <Wrap spacing={2}>
                      {AVAILABLE_TAGS.map((tag) => (
                        <WrapItem key={tag}>
                          <Checkbox
                            isChecked={tempEditTags.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempEditTags([...tempEditTags, tag])
                              } else {
                                setTempEditTags(tempEditTags.filter(t => t !== tag))
                              }
                            }}
                            colorScheme="blue"
                          >
                            <Tag
                              size="md"
                              variant={tempEditTags.includes(tag) ? "solid" : "outline"}
                              colorScheme="blue"
                            >
                              <TagLabel>{tag}</TagLabel>
                            </Tag>
                          </Checkbox>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </VStack>
                </Box>

                {/* 絶対にやりたくないロール編集 */}
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>絶対にやりたくないロール</Text>
                  <VStack spacing={3} align="stretch">
                    <Wrap spacing={2}>
                      {Object.values(GameRole).map((role) => (
                        <WrapItem key={role}>
                          <Checkbox
                            isChecked={tempEditUnwantedRoles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempEditUnwantedRoles([...tempEditUnwantedRoles, role])
                              } else {
                                setTempEditUnwantedRoles(tempEditUnwantedRoles.filter(r => r !== role))
                              }
                            }}
                            colorScheme="red"
                          >
                            <Tag
                              size="md"
                              variant={tempEditUnwantedRoles.includes(role) ? "solid" : "outline"}
                              colorScheme="red"
                            >
                              <TagLabel>{role}</TagLabel>
                            </Tag>
                          </Checkbox>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </VStack>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCancelEditModal}>
                キャンセル
              </Button>
              <Button colorScheme="blue" onClick={handleSaveEditModal}>
                保存
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 履歴表示モーダル */}
        <Modal isOpen={isHistoryModalOpen} onClose={handleCloseHistoryModal} size="4xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent maxW="90vw" maxH="90vh">
            <ModalHeader>
              {historyModalPlayer?.nickname || historyModalPlayer?.name} の試合履歴
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                {/* 統計情報 */}
                <ChakraCard>
                  <CardBody>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.600">総試合数</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                          {playerMatches.length}
                        </Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.600">勝利数</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                          {playerMatches.filter(m => m.isWinner).length}
                        </Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.600">敗北数</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="red.500">
                          {playerMatches.filter(m => !m.isWinner).length}
                        </Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.600">勝率</Text>
                        <Text fontSize="2xl" fontWeight="bold" color={playerMatches.length > 0 && (playerMatches.filter(m => m.isWinner).length / playerMatches.length) >= 0.5 ? 'green.500' : 'red.500'}>
                          {playerMatches.length > 0
                            ? Math.round((playerMatches.filter(m => m.isWinner).length / playerMatches.length) * 100)
                            : 0}%
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </ChakraCard>

                {/* 試合履歴リスト */}
                {playerMatches.length === 0 ? (
                  <Box textAlign="center" py={8}>
                    <Text color="gray.500">試合履歴がありません</Text>
                  </Box>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>日時</Th>
                          <Th>チーム</Th>
                          <Th>ロール</Th>
                          <Th>結果</Th>
                          <Th>勝者</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {playerMatches.map((match) => (
                          <Tr key={match.id}>
                            <Td>
                              {new Date(match.date.seconds * 1000).toLocaleString('ja-JP')}
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={match.playerTeam === 'BLUE' ? 'blue' : 'red'}
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {match.playerTeam === 'BLUE' ? 'ブルーチーム' : 'レッドチーム'}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  match.playerRole === 'TOP' ? 'red' :
                                  match.playerRole === 'JUNGLE' ? 'green' :
                                  match.playerRole === 'MID' ? 'blue' :
                                  match.playerRole === 'ADC' ? 'purple' : 'orange'
                                }
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {match.playerRole}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={match.isWinner ? 'green' : 'red'}
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {match.isWinner ? '勝利' : '敗北'}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={match.winner === 'BLUE' ? 'blue' : 'red'}
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {match.winner === 'BLUE' ? 'ブルーチーム' : 'レッドチーム'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={handleCloseHistoryModal}>閉じる</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Layout>
  )
} 