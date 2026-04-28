import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'var(--bg-0)',
        color: 'var(--fg-0)',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '9px',
      },
      variants: {
        solid: {
          bg: 'var(--fg-0)',
          color: 'var(--bg-0)',
          boxShadow: 'none',
          _hover: { bg: 'var(--gold)' },
        },
        outline: {
          borderColor: 'var(--line-2)',
          color: 'var(--fg-1)',
          _hover: { bg: 'var(--bg-2)' },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'var(--bg-1)',
            borderColor: 'var(--line)',
            color: 'var(--fg-0)',
            _placeholder: { color: 'var(--fg-3)' },
            _focus: { borderColor: 'var(--line-2)', boxShadow: 'none' },
          },
        },
      },
    },
  },
})

export default theme
