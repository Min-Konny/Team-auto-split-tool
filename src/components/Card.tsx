import { Box, BoxProps } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface CardProps extends BoxProps {
  children: ReactNode
  isHoverable?: boolean
}

export default function Card({ children, isHoverable = true, ...props }: CardProps) {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="base"
      p={4}
      transition="all 0.2s"
      _hover={isHoverable ? { boxShadow: 'md', transform: 'translateY(-2px)' } : undefined}
      {...props}
    >
      {children}
    </Box>
  )
} 