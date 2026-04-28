import { Box, Flex, HStack, Link as CLink, Text } from '@chakra-ui/react'
import Link from 'next/link'

const navItem = {
  px: 3.5,
  py: 1.5,
  borderRadius: '999px',
  color: 'var(--fg-1)',
  fontSize: '13px',
  textDecoration: 'none',
  _hover: { bg: 'var(--bg-2)', color: 'var(--fg-0)' },
}

export default function Header() {
  return (
    <Box
      position="sticky"
      top={0}
      zIndex={50}
      backdropFilter="blur(18px)"
      bg="color-mix(in oklch, var(--bg-0) 85%, transparent)"
      borderBottom="1px solid"
      borderColor="var(--line)"
    >
      <Flex maxW="1440px" mx="auto" px="28px" py="12px" align="center" justify="space-between">
        <CLink as={Link} href="/" display="flex" alignItems="center" gap={2.5} _hover={{ textDecoration: 'none' }}>
          <Box w="26px" h="26px" position="relative">
            <Box
              position="absolute"
              inset={0}
              borderRadius="3px"
              bg="linear-gradient(135deg, var(--blue), var(--blue-d))"
              sx={{ clipPath: 'polygon(0 0,100% 0,100% 100%,50% 100%,0 50%)' }}
            />
            <Box
              position="absolute"
              inset={0}
              borderRadius="3px"
              bg="linear-gradient(135deg, var(--red-d), var(--red))"
              sx={{ clipPath: 'polygon(50% 100%,100% 100%,100% 50%)' }}
            />
          </Box>
          <Text fontFamily="'Space Grotesk', sans-serif" fontWeight={600} fontSize="15px" color="var(--fg-0)">
            Team Maker
            <Text as="span" ml={1} fontFamily="'JetBrains Mono', monospace" fontSize="10px" color="var(--fg-3)" letterSpacing="0.12em" textTransform="uppercase">
              / LoL
            </Text>
          </Text>
        </CLink>

        <HStack spacing={1}>
          <CLink as={Link} href="/players" sx={navItem}>{'\u30d7\u30ec\u30a4\u30e4\u30fc'}</CLink>
          <CLink as={Link} href="/players/new" sx={navItem}>{'\u767b\u9332'}</CLink>
          <CLink as={Link} href="/matches" sx={navItem}>{'\u8a66\u5408\u5c65\u6b74'}</CLink>
          <CLink as={Link} href="/team-maker" sx={{ ...navItem, bg: 'var(--fg-0)', color: 'var(--bg-0)', ml: 2, _hover: { bg: 'var(--fg-1)' } }}>
            {'\u30c1\u30fc\u30e0\u4f5c\u6210'} {'\u2192'}
          </CLink>
        </HStack>
      </Flex>
    </Box>
  )
}
