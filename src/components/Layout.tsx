import { Box } from '@chakra-ui/react'
import Header from '@/components/Header'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" bg="var(--bg-0)" color="var(--fg-0)" fontFamily="body">
      <Header />
      <Box
        as="main"
        maxW="1440px"
        mx="auto"
        px={{ base: 4, md: '28px' }}
        pt={{ base: '20px', md: '28px' }}
        pb="60px"
      >
        {children}
      </Box>
    </Box>
  )
}
