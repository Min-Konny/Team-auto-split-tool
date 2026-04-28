import { Box, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface CardProps extends BoxProps {
  children: ReactNode
  /** ホバーで浮き を抑止したいとき */
  isHoverable?: boolean
}

export default function Card({ children, isHoverable = true, ...props }: CardProps) {
  return (
    <Box
      bg="var(--bg-1)"
      borderRadius="13px"
      borderWidth="1px"
      borderColor="var(--line)"
      boxShadow="none"
      transition="border-color 0.15s ease, transform 0.15s ease"
      {...(isHoverable
        ? {
            _hover: {
              borderColor: 'var(--line-2)',
              transform: 'translateY(-1px)',
            },
          }
        : {})}
      {...props}
    >
      {children}
    </Box>
  )
}
