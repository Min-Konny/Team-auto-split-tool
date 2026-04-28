import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          boxShadow: 'base',
          p: 4,
          bg: 'white',
          transition: 'all 0.2s',
        },
      },
      variants: {
        hoverable: {
          container: {
            _hover: {
              transform: 'translateY(-2px)',
              boxShadow: 'md',
            },
          },
        },
      },
    },
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
      variants: {
        solid: {
          boxShadow: 'md',
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          },
        },
      },
    },
  },
  colors: {
    roleColors: {
      TOP: 'red.500',
      JUNGLE: 'green.500',
      MID: 'blue.500',
      ADC: 'purple.500',
      SUP: 'orange.500',
      FILL: 'gray.500',
    },
  },
})

export default theme 