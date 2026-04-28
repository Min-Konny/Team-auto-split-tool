import { Box, Flex, Link, Heading } from '@chakra-ui/react'
import NextLink from 'next/link'

export default function Header() {
  return (
    <Box bg="blue.500" px={4} py={3}>
      <Flex maxW="container.lg" mx="auto" align="center" justify="space-between">
        <NextLink href="/" passHref>
          <Link>
            <Heading size="md" color="white">
              LoL Team Maker
            </Heading>
          </Link>
        </NextLink>
        <Flex gap={4}>
          <NextLink href="/players" passHref>
            <Link color="white">プレイヤーリスト</Link>
          </NextLink>
          <NextLink href="/players/new" passHref>
            <Link color="white">プレイヤー登録</Link>
          </NextLink>
          <NextLink href="/team-maker" passHref>
            <Link color="white">チーム作成</Link>
          </NextLink>
          <NextLink href="/matches" passHref>
            <Link color="white">試合履歴</Link>
          </NextLink>
        </Flex>
      </Flex>
    </Box>
  )
} 