import { useState, useEffect } from 'react'
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
  useToast,
  Text,
  Grid,
  GridItem,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  InputGroup,
  InputRightElement,
  Checkbox,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player, Role, Rank, RANK_RATES, GameRole } from '@/types'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Card from '@/components/Card'

// 利用可能なタグオプション
const AVAILABLE_TAGS = ['249', 'SHIFT', 'きらくに']

export default function NewPlayer() {
  const [summonerName, setSummonerName] = useState('')
  const [nickname, setNickname] = useState('')
  const [mainRole, setMainRole] = useState<GameRole>(GameRole.TOP)
  const [mainRank, setMainRank] = useState<Rank>('UNRANKED')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [unwantedRoles, setUnwantedRoles] = useState<GameRole[]>([])
  const toast = useToast()
  const router = useRouter()


  // レートを計算
  const calculateRates = () => {
    const mainRate = RANK_RATES[mainRank].main
    const subRate = RANK_RATES[mainRank].sub
    return { mainRate, subRate }
  }

  // タグの選択/解除
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 絶対にやりたくないロールの選択/解除
  const handleUnwantedRoleToggle = (role: GameRole) => {
    setUnwantedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!summonerName.trim()) {
      toast({
        title: 'エラー',
        description: 'サモナーネームを入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    if (!mainRole) {
      toast({
        title: 'エラー',
        description: 'メインロールを選択してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    if (!mainRank) {
      toast({
        title: 'エラー',
        description: 'ランクを選択してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    if (selectedTags.length === 0) {
      toast({
        title: 'エラー',
        description: 'タグを1つ以上選択してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 確認ダイアログを表示
    const nicknameText = nickname.trim() ? `\nニックネーム: ${nickname}` : ''
    if (!window.confirm(`以下の内容で登録しますか？\n\nサモナーネーム: ${summonerName}${nicknameText}\nメインロール: ${mainRole}\nタグ: ${selectedTags.join(', ')}`)) {
      return
    }

    try {
      const rates = calculateRates()
      const trimmedNickname = nickname.trim()
      const player: Omit<Player, 'id'> = {
        name: summonerName,
        mainRole,
        mainRate: rates.mainRate,
        subRate: rates.subRate,
        stats: {
          wins: 0,
          losses: 0,
        },
        tags: selectedTags,
        ...(trimmedNickname ? { nickname: trimmedNickname } : {}),
        ...(unwantedRoles.length > 0 ? { unwantedRoles } : {}),
      }

      await addDoc(collection(db, 'players'), player)

      toast({
        title: '登録完了',
        description: 'プレイヤーを登録しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      router.push('/')
    } catch (error) {
      console.error('Error adding player:', error)
      toast({
        title: 'エラー',
        description: 'プレイヤーの登録に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center" color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
          プレイヤー登録
        </Heading>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Stack spacing={6}>
            <Card>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">サモナーネーム</FormLabel>
                <Input 
                  value={summonerName} 
                  onChange={(e) => setSummonerName(e.target.value)}
                  size="lg"
                  borderRadius="md"
                  placeholder="FAKER#JP1"
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
                />
              </FormControl>
            </Card>

            <Card>
              <FormControl>
                <FormLabel fontWeight="bold">ニックネーム（Discord表示名）</FormLabel>
                <Input 
                  value={nickname} 
                  onChange={(e) => setNickname(e.target.value)}
                  size="lg"
                  borderRadius="md"
                  placeholder="こにー（任意）"
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
                />
                <Text fontSize="sm" color="gray.600" mt={2}>
                  プレイヤー一覧で優先的に表示されます（任意）
                </Text>
              </FormControl>
            </Card>

            <Card>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">メインロール</FormLabel>
                <Select 
                  value={mainRole} 
                  onChange={(e) => setMainRole(e.target.value as GameRole)}
                  size="lg"
                  borderRadius="md"
                >
                  {Object.values(GameRole).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Card>

            <Card>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">ランク</FormLabel>
                <Select 
                  value={mainRank} 
                  onChange={(e) => setMainRank(e.target.value as Rank)}
                  size="lg"
                  borderRadius="md"
                >
                  {Object.keys(RANK_RATES).map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </Select>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  メインロールレート: {RANK_RATES[mainRank].main} | サブロールレート: {RANK_RATES[mainRank].sub}
                </Text>
              </FormControl>
            </Card>

            <Card>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">タグ</FormLabel>
                <Wrap spacing={3} mt={2}>
                  {AVAILABLE_TAGS.map((tag) => (
                    <WrapItem key={tag}>
                      <Button
                        size="lg"
                        variant={selectedTags.includes(tag) ? "solid" : "outline"}
                        colorScheme="blue"
                        onClick={() => handleTagToggle(tag)}
                        borderRadius="full"
                        _hover={{
                          transform: "scale(1.05)",
                          boxShadow: "md"
                        }}
                        transition="all 0.2s"
                      >
                        {tag}
                      </Button>
                    </WrapItem>
                  ))}
                </Wrap>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  よく遊ぶメンバーや特徴をタグで管理できます（必須）
                </Text>
              </FormControl>
            </Card>

            <Card>
              <FormControl>
                <FormLabel fontWeight="bold">絶対にやりたくないロール</FormLabel>
                <Wrap spacing={3} mt={2}>
                  {Object.values(GameRole).map((role) => (
                    <WrapItem key={role}>
                      <Button
                        size="lg"
                        variant={unwantedRoles.includes(role) ? "solid" : "outline"}
                        colorScheme="red"
                        onClick={() => handleUnwantedRoleToggle(role)}
                        borderRadius="full"
                        _hover={{
                          transform: "scale(1.05)",
                          boxShadow: "md"
                        }}
                        transition="all 0.2s"
                      >
                        {role}
                      </Button>
                    </WrapItem>
                  ))}
                </Wrap>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  絶対にやりたくないロールを選択してください（任意）
                </Text>
              </FormControl>
            </Card>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="full"
              boxShadow="md"
              isDisabled={!summonerName.trim() || !mainRole || !mainRank || selectedTags.length === 0}
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
            >
              登録
            </Button>
          </Stack>
        </form>
      </VStack>
    </Layout>
  )
} 