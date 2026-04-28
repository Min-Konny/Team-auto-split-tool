import { Box, Heading, Text, VStack, SimpleGrid } from '@chakra-ui/react'
import Link from 'next/link'
import Layout from '@/components/Layout'

const cards = [
  {
    href: '/team-maker',
    title: 'チーム作成',
    subtitle: 'TEAM SPLIT',
    desc: 'レート・希望ロールを踏まえて Blue / Red を自動生成します。',
    primary: true,
  },
  {
    href: '/players',
    title: 'プレイヤーリスト',
    subtitle: 'ROSTER',
    desc: '登録済みプレイヤーを検索・編集。',
    primary: false,
  },
  {
    href: '/players/new',
    title: 'プレイヤー登録',
    subtitle: 'ENLIST',
    desc: '新規プレイヤーを追加してレート・タグを設定。',
    primary: false,
  },
  {
    href: '/matches',
    title: '試合履歴',
    subtitle: 'RECORDS',
    desc: '過去の試合結果と参加者を一覧で確認。',
    primary: false,
  },
] as const

export default function Home() {
  return (
    <Layout>
      <VStack spacing={{ base: 8, md: 10 }} align="stretch" className="lol-animate-up">
        {/* Hero: Blue | VS | Red */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} alignItems="stretch">
          <Box
            borderRadius="14px"
            borderWidth="1px"
            borderColor="var(--blue-d)"
            bg="linear-gradient(135deg, color-mix(in oklch, var(--blue) 22%, transparent) 0%, var(--bg-1) 55%)"
            p={{ base: 6, md: 8 }}
            minH="160px"
            display="flex"
            flexDirection="column"
            justifyContent="flex-end"
            transition="all 0.15s ease"
            _hover={{ borderColor: 'var(--blue)' }}
          >
            <Text
              fontSize="11px"
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing="0.14em"
              color="var(--fg-3)"
            >
              SIDE A
            </Text>
            <Heading size="xl" mt={2}>
              BLUE SIDE
            </Heading>
            <Text mt={3} fontSize="sm" color="var(--fg-1)" lineHeight="tall">
              ブルーサイドのロスター構成とゲームプランへ。
            </Text>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="14px"
            borderWidth="1px"
            borderColor="var(--line)"
            bg="var(--bg-1)"
            minH={{ base: '96px', md: '160px' }}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              inset="20% 45%"
              w="2px"
              bg="linear-gradient(180deg, transparent, var(--fg-3), transparent)"
              opacity={0.85}
              display={{ base: 'none', md: 'block' }}
            />
            <VStack spacing={2}>
              <Text
                fontSize="xl"
                fontFamily="heading"
                fontWeight={800}
                letterSpacing="-0.04em"
                bg="linear-gradient(90deg, var(--blue), var(--gold), var(--red))"
                backgroundClip="text"
                sx={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}
              >
                VS
              </Text>
              <Text fontSize="xs" color="var(--fg-3)" letterSpacing="0.12em">
                LoL TEAM MAKER
              </Text>
            </VStack>
          </Box>

          <Box
            borderRadius="14px"
            borderWidth="1px"
            borderColor="var(--red-d)"
            bg="linear-gradient(315deg, color-mix(in oklch, var(--red) 22%, transparent) 0%, var(--bg-1) 55%)"
            p={{ base: 6, md: 8 }}
            minH="160px"
            display="flex"
            flexDirection="column"
            justifyContent="flex-end"
            transition="all 0.15s ease"
            _hover={{ borderColor: 'var(--red)' }}
          >
            <Text fontSize="11px" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.14em" color="var(--fg-3)">
              SIDE B
            </Text>
            <Heading size="xl" mt={2}>
              RED SIDE
            </Heading>
            <Text mt={3} fontSize="sm" color="var(--fg-1)" lineHeight="tall">
              レッドサイドでのピック順・ドラフト視点での調整に。
            </Text>
          </Box>
        </SimpleGrid>

        <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }} fontFamily="heading" letterSpacing="-0.02em">
          機能
        </Heading>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          {cards.map((c) => (
            <Box
              key={c.href}
              as={Link}
              href={c.href}
              borderRadius="14px"
              borderWidth="1px"
              borderColor="var(--line)"
              bg="var(--bg-1)"
              p={{ base: 5, md: 6 }}
              cursor="pointer"
              textDecoration="none"
              transition="all 0.15s ease"
              _hover={{
                borderColor: 'var(--line-2)',
                transform: 'translateY(-4px)',
                bg: 'var(--bg-2)',
              }}
              display="block"
            >
              <Text fontSize="10px" fontFamily="'JetBrains Mono', monospace" color="var(--fg-3)" letterSpacing="0.14em">
                {c.subtitle}
              </Text>
              <Heading as="h3" size="lg" mt={3} mb={2} flex="1">
                {c.title}
              </Heading>
              <Text fontSize="sm" color="var(--fg-1)" mb={5}>
                {c.desc}
              </Text>
              <Text
                as="span"
                display="inline-block"
                mt={5}
                fontFamily="heading"
                fontWeight={700}
                fontSize="xs"
                px={5}
                py={2.5}
                borderRadius="9px"
                borderWidth={c.primary ? '0' : '1px'}
                borderStyle="solid"
                borderColor="var(--line-2)"
                bg={c.primary ? 'var(--fg-0)' : 'transparent'}
                color={c.primary ? 'var(--bg-0)' : 'var(--fg-1)'}
              >
                {c.primary ? 'いま開始' : '開く'}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Layout>
  )
}
