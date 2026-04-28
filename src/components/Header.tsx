import {
  Box,
  Flex,
  Link as ChakraLink,
  HStack,
  Button,
  Text,
} from '@chakra-ui/react'
import Link from 'next/link'

const navLinkSx = {
  px: 3,
  py: 2,
  borderRadius: '999px',
  fontSize: 'sm',
  color: 'var(--fg-1)',
  transition: 'all 0.15s ease',
  borderWidth: '1px',
  borderColor: 'transparent',
  fontFamily: 'heading',
  fontWeight: 500,
  _hover: {
    textDecoration: 'none',
    bg: 'var(--bg-2)',
    borderColor: 'var(--line)',
    color: 'var(--fg-0)',
  },
}

export default function Header() {
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      backdropFilter="blur(18px)"
      bg="color-mix(in oklch, var(--bg-0) 85%, transparent)"
      borderBottomWidth="1px"
      borderBottomColor="var(--line)"
    >
      <Flex
        maxW="1440px"
        mx="auto"
        px={{ base: 4, md: 7 }}
        py={3}
        align="center"
        justify="space-between"
        gap={4}
        flexWrap="wrap"
      >
        <Flex
          as={Link}
          href="/"
          align="center"
          gap={3}
          textDecoration="none"
          cursor="pointer"
          _hover={{ opacity: 0.92 }}
        >
          {/* Blue / Red 三角ブランド */}
          <Box position="relative" w="38px" h="38px" flexShrink={0}>
            <Box
              position="absolute"
              inset={0}
              bg="color-mix(in oklch, var(--blue) 45%, transparent)"
              clipPath="polygon(0 0, 55% 0, 55% 100%, 0 100%)"
              borderRadius="8px"
            />
            <Box
              position="absolute"
              inset={0}
              bg="color-mix(in oklch, var(--red) 45%, transparent)"
              clipPath="polygon(45% 0, 100% 0, 100% 100%, 45% 100%)"
              borderRadius="8px"
            />
            <Box
              position="absolute"
              left="55%"
              top="50%"
              transform="translate(-50%, -50%) rotate(90deg)"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10px"
              fontWeight={700}
              color="var(--fg-0)"
              opacity={0.92}
              pointerEvents="none"
            >
              VS
            </Box>
          </Box>
          <Box>
            <Text
              fontFamily="heading"
              fontWeight={700}
              fontSize={{ base: 'md', md: 'lg' }}
              letterSpacing="-0.03em"
              color="var(--fg-0)"
              lineHeight="shorter"
            >
              LoL Team Maker
            </Text>
            <Text fontSize="10px" fontFamily="'JetBrains Mono', monospace" color="var(--fg-3)" letterSpacing="0.12em">
              CUSTOM SPLIT TOOL
            </Text>
          </Box>
        </Flex>

        <HStack spacing={2} flexWrap="wrap" justify="flex-end">
          <ChakraLink as={Link} href="/players" sx={navLinkSx}>
            プレイヤー
          </ChakraLink>
          <ChakraLink as={Link} href="/players/new" sx={navLinkSx}>
            登録
          </ChakraLink>
          <ChakraLink as={Link} href="/matches" sx={navLinkSx}>
            試合履歴
          </ChakraLink>
          <Button
            as={Link}
            href="/team-maker"
            size="sm"
            variant="solid"
            colorScheme="lolPrimary"
            borderRadius="9px"
            px={5}
          >
            チーム作成
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
}
