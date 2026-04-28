import { Box, BoxProps } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface CardProps extends BoxProps {
  children: ReactNode
  isHoverable?: boolean
}

export default function Card({ children, isHoverable = true, ...props }: CardProps) {
  return (
    <Box
      bg="var(--bg-1)"
      borderRadius="13px"
      border="1px solid"
      borderColor="var(--line)"
      p={4}
      transition="all 0.15s"
      _hover={isHoverable ? { borderColor: 'var(--line-2)', transform: 'translateY(-2px)' } : undefined}
      {...props}
    >
      {children}
    </Box>
  )
}
