import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  VStack,
  useToast,
  Text,
  SimpleGrid,
  HStack,
  Checkbox,
  Wrap,
  WrapItem,
  Divider,
  Tag,
  TagLabel,
} from '@chakra-ui/react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player, Rank, RANK_RATES, GameRole } from '@/types'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Card from '@/components/Card'
import RoleBadge from '@/components/RoleBadge'
import RankChip from '@/components/RankChip'
import { AVAILABLE_TAGS } from '@/constants/playerTags'

const ROLE_BORDER: Record<GameRole, string> = {
  TOP: 'color-mix(in oklch, var(--r-top) 55%, transparent)',
  JUNGLE: 'color-mix(in oklch, var(--r-jng) 55%, transparent)',
  MID: 'color-mix(in oklch, var(--r-mid) 55%, transparent)',
  ADC: 'color-mix(in oklch, var(--r-adc) 55%, transparent)',
  SUP: 'color-mix(in oklch, var(--r-sup) 55%, transparent)',
}

const ROLE_BG: Record<GameRole, string> = {
  TOP: 'color-mix(in oklch, var(--r-top) 15%, transparent)',
  JUNGLE: 'color-mix(in oklch, var(--r-jng) 15%, transparent)',
  MID: 'color-mix(in oklch, var(--r-mid) 15%, transparent)',
  ADC: 'color-mix(in oklch, var(--r-adc) 15%, transparent)',
  SUP: 'color-mix(in oklch, var(--r-sup) 15%, transparent)',
}

export default function NewPlayer() {
  const [summonerName, setSummonerName] = useState('')
  const [nickname, setNickname] = useState('')
  const [mainRole, setMainRole] = useState<GameRole>(GameRole.TOP)
  const [mainRank, setMainRank] = useState<Rank>('UNRANKED')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [unwantedRoles, setUnwantedRoles] = useState<GameRole[]>([])
  const toast = useToast()
  const router = useRouter()

  const calculateRates = () => {
    const mainRate = RANK_RATES[mainRank].main
    const subRate = RANK_RATES[mainRank].sub
    return { mainRate, subRate }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleUnwantedRoleToggle = (role: GameRole) => {
    setUnwantedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

    const nicknameText = nickname.trim() ? `\nニックネーム: ${nickname}` : ''
    if (
      !window.confirm(
        `以下の内容で登録しますか？\n\nサモナーネーム: ${summonerName}${nicknameText}\nメインロール: ${mainRole}\nタグ: ${selectedTags.join(', ')}`
      )
    ) {
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

      router.push('/players')
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

  const rates = calculateRates()

  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        <Heading size="xl">プレイヤー登録</Heading>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} alignItems="start">
            <Stack spacing={6}>
              <Card>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color="var(--fg-1)">
                    サモナーネーム
                  </FormLabel>
                  <Input
                    value={summonerName}
                    onChange={(e) => setSummonerName(e.target.value)}
                    size="lg"
                    placeholder="FAKER#JP1"
                  />
                </FormControl>
              </Card>

              <Card>
                <FormControl>
                  <FormLabel fontWeight="bold" color="var(--fg-1)">
                    ニックネーム（Discord表示名）
                  </FormLabel>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    size="lg"
                    placeholder="こにー（任意）"
                  />
                  <Text fontSize="sm" color="var(--fg-2)" mt={2}>
                    プレイヤー一覧で優先的に表示されます（任意）
                  </Text>
                </FormControl>
              </Card>

              <Card>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color="var(--fg-1)">
                    メインロール
                  </FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {Object.values(GameRole).map((role) => {
                      const active = mainRole === role
                      return (
                        <Button
                          key={role}
                          type="button"
                          flex="1"
                          minW="56px"
                          size="sm"
                          variant={active ? 'solid' : 'outline'}
                          borderWidth="1px"
                          borderColor={ROLE_BORDER[role]}
                          bg={active ? ROLE_BG[role] : 'transparent'}
                          color={active ? 'var(--fg-0)' : 'var(--fg-2)'}
                          onClick={() => setMainRole(role)}
                        >
                          {role}
                        </Button>
                      )
                    })}
                  </HStack>
                </FormControl>
              </Card>

              <Card>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color="var(--fg-1)">
                    ランク
                  </FormLabel>
                  <Stack spacing={1} maxH="280px" overflowY="auto" pr={1}>
                    {(Object.keys(RANK_RATES) as Rank[]).map((rank) => {
                      const active = mainRank === rank
                      return (
                        <Box
                          key={rank}
                          as="button"
                          type="button"
                          w="full"
                          textAlign="left"
                          px={3}
                          py={2.5}
                          borderRadius="9px"
                          borderWidth="1px"
                          borderColor={active ? 'var(--line-2)' : 'var(--line)'}
                          bg={active ? 'var(--bg-2)' : 'transparent'}
                          onClick={() => setMainRank(rank)}
                          transition="all 0.15s ease"
                          _hover={{ borderColor: 'var(--line-2)', bg: 'var(--bg-2)' }}
                        >
                          <HStack justify="space-between" align="center">
                            <Text fontWeight={600} fontSize="sm">
                              {rank}
                            </Text>
                            <HStack spacing={3} fontSize="xs" color="var(--fg-2)">
                              <Text fontFamily="'JetBrains Mono', monospace">
                                M {RANK_RATES[rank].main}
                              </Text>
                              <Text fontFamily="'JetBrains Mono', monospace">
                                S {RANK_RATES[rank].sub}
                              </Text>
                            </HStack>
                          </HStack>
                        </Box>
                      )
                    })}
                  </Stack>
                </FormControl>
              </Card>

              <Card>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color="var(--fg-1)">
                    タグ
                  </FormLabel>
                  <Wrap spacing={3} mt={2}>
                    {AVAILABLE_TAGS.map((tag) => (
                      <WrapItem key={tag}>
                        <Button
                          type="button"
                          size="md"
                          variant={selectedTags.includes(tag) ? 'solid' : 'outline'}
                          colorScheme="lolPrimary"
                          borderRadius="full"
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                        </Button>
                      </WrapItem>
                    ))}
                  </Wrap>
                  <Text fontSize="sm" color="var(--fg-2)" mt={2}>
                    タグは {AVAILABLE_TAGS.join(' / ')} から選べます（必須）
                  </Text>
                </FormControl>
              </Card>

              <Card>
                <FormControl>
                  <FormLabel fontWeight="bold" color="var(--fg-1)">
                    絶対にやりたくないロール
                  </FormLabel>
                  <Wrap spacing={3} mt={2}>
                    {Object.values(GameRole).map((role) => (
                      <WrapItem key={role}>
                        <Button
                          type="button"
                          size="sm"
                          variant={unwantedRoles.includes(role) ? 'solid' : 'outline'}
                          colorScheme="red"
                          borderRadius="full"
                          onClick={() => handleUnwantedRoleToggle(role)}
                        >
                          {role}
                        </Button>
                      </WrapItem>
                    ))}
                  </Wrap>
                  <Text fontSize="sm" color="var(--fg-2)" mt={2}>
                    絶対にやりたくないロールを選択してください（任意）
                  </Text>
                </FormControl>
              </Card>

              <Button type="submit" colorScheme="lolPrimary" size="lg" w="full" variant="solid" isDisabled={!summonerName.trim() || selectedTags.length === 0}>
                登録
              </Button>
            </Stack>

            <Box position={{ base: 'relative', lg: 'sticky' }} top={{ lg: '90px' }}>
              <Card isHoverable={false}>
                <Text
                  fontSize="10px"
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="0.14em"
                  color="var(--fg-3)"
                  textTransform="uppercase"
                  mb={4}
                >
                  Live preview
                </Text>
                <Text fontSize="xl" fontWeight={700}>
                  {summonerName || 'Summoners Rift'}
                </Text>
                {nickname.trim() ? (
                  <Text fontSize="sm" color="var(--fg-2)" mt={1}>
                    ({nickname.trim()})
                  </Text>
                ) : null}
                <Divider my={4} />
                <HStack spacing={4} align="start">
                  <Box>
                    <Text fontSize="10px" color="var(--fg-3)" mb={1}>
                      ROLE
                    </Text>
                    <RoleBadge role={mainRole} />
                  </Box>
                  <Box flex="1">
                    <Text fontSize="10px" color="var(--fg-3)" mb={1}>
                      RATES
                    </Text>
                    <VStack align="start" spacing={3}>
                      <Box>
                        <Text fontFamily="'JetBrains Mono', monospace" fontSize="lg" fontWeight={700} color="var(--blue)">
                          {rates.mainRate}
                        </Text>
                        <RankChip rate={rates.mainRate} />
                      </Box>
                      <Box>
                        <Text fontFamily="'JetBrains Mono', monospace" fontSize="lg" fontWeight={700} color="var(--fg-1)">
                          {rates.subRate}
                        </Text>
                        <RankChip rate={rates.subRate} />
                      </Box>
                    </VStack>
                  </Box>
                </HStack>
                <Divider my={4} />
                <Text fontSize="10px" color="var(--fg-3)" mb={2}>
                  TAGS
                </Text>
                <Wrap>
                  {(selectedTags.length ? selectedTags : ['（未選択）']).map((t) => (
                    <WrapItem key={t}>
                      <Tag variant="outline" borderColor="var(--line)">
                        <TagLabel>{t}</TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
                <Divider my={4} />
                <Text fontSize="10px" color="var(--fg-3)" mb={2}>
                  NG ROLES
                </Text>
                <Wrap>
                  {(unwantedRoles.length ? unwantedRoles.map(String) : ['なし']).map((r) => (
                    <WrapItem key={r}>
                      <Tag size="sm" borderColor="var(--line)">
                        <TagLabel>{r}</TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Card>
            </Box>
          </SimpleGrid>
        </form>
      </VStack>
    </Layout>
  )
}
