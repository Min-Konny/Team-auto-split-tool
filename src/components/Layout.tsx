import { Box } from '@chakra-ui/react'
import Header from './Header'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" bg="var(--bg-0)" color="var(--fg-0)">
      <Header />
      <Box maxW="1440px" mx="auto" px="28px" py="28px">
        {children}
      </Box>
    </Box>
  )
}
