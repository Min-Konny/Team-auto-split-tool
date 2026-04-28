import { Box, Container } from '@chakra-ui/react'
import Header from './Header'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Header />
      <Container
        maxW="container.xl"
        py={8}
        px={{ base: 4, md: 8 }}
        position="relative"
      >
        <Box
          bg="white"
          borderRadius="xl"
          boxShadow="lg"
          p={{ base: 4, md: 6, lg: 8 }}
          transition="all 0.2s"
          _hover={{ boxShadow: 'xl' }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  )
} 