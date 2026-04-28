import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: `'Space Grotesk', ui-sans-serif, sans-serif`,
    body: `'Noto Sans JP', 'Inter', ui-sans-serif, sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'var(--bg-0)',
        color: 'var(--fg-0)',
        transitionProperty: 'background-color, color',
        transitionDuration: '0.15s',
      },
    },
  },
  components: {
    Heading: {
      baseStyle: {
        fontFamily: 'heading',
        letterSpacing: '-0.02em',
        color: 'var(--fg-0)',
      },
      sizes: {
        lg: {
          fontSize: 'xl',
          fontWeight: '600',
        },
        xl: {
          fontSize: '22px',
          fontWeight: '600',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'var(--bg-1)',
          borderRadius: '13px',
          borderWidth: '1px',
          borderColor: 'var(--line)',
          boxShadow: 'none',
          p: { base: 4, md: 5 },
          transitionProperty: 'border-color',
          transitionDuration: '0.15s',
          _hover: {
            borderColor: 'var(--line-2)',
          },
        },
      },
      variants: {
        hoverable: {
          container: {
            _hover: {
              borderColor: 'var(--line-2)',
              transform: 'translateY(-2px)',
              boxShadow: 'none',
            },
          },
        },
        flat: {
          container: {
            _hover: {
              transform: undefined,
              borderColor: 'var(--line)',
            },
          },
        },
      },
    },
    Button: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: '700',
        borderRadius: '9px',
        transition: 'all 0.15s ease',
        boxShadow: 'none',
        _focusVisible: {
          boxShadow: 'none',
        },
      },
      variants: {
        solid: (props: { colorScheme?: string }) => {
          const { colorScheme: c } = props
          if (c === 'red') {
            return {
              bg: 'color-mix(in oklch, var(--red) 28%, transparent)',
              color: 'var(--fg-0)',
              borderWidth: '1px',
              borderColor: 'var(--red-d)',
              _hover: {
                bg: 'color-mix(in oklch, var(--red) 40%, transparent)',
              },
              _active: { bg: 'color-mix(in oklch, var(--red) 42%, transparent)' },
            }
          }
          if (
            !c ||
            c === 'lolPrimary' ||
            c === 'blue' ||
            c === 'purple' ||
            c === 'green' ||
            c === 'cyan' ||
            c === 'teal'
          ) {
            return {
              bg: 'var(--fg-0)',
              color: 'var(--bg-0)',
              _hover: { bg: 'var(--gold)', color: 'var(--bg-0)' },
              _active: { bg: 'var(--gold)' },
            }
          }
          return {
            bg: 'var(--bg-2)',
            color: 'var(--fg-0)',
            borderWidth: '1px',
            borderColor: 'var(--line)',
            _hover: { bg: 'var(--bg-3)', borderColor: 'var(--line-2)' },
          }
        },
        outline: {
          borderWidth: '1px',
          borderColor: 'var(--line-2)',
          color: 'var(--fg-1)',
          bg: 'transparent',
          _hover: {
            bg: 'var(--bg-2)',
            color: 'var(--fg-0)',
          },
        },
        ghost: {
          color: 'var(--fg-1)',
          _hover: {
            bg: 'var(--bg-2)',
            color: 'var(--fg-0)',
          },
        },
      },
      defaultProps: {
        colorScheme: 'lolPrimary',
        variant: 'solid',
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'var(--bg-0)',
            borderColor: 'var(--line)',
            color: 'var(--fg-0)',
            borderRadius: '9px',
            transition: 'all 0.15s ease',
            _placeholder: { color: 'var(--fg-3)' },
            _focus: {
              borderColor: 'var(--line-2)',
              boxShadow: 'none',
            },
            _hover: {
              borderColor: 'var(--line-2)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
        focusBorderColor: 'var(--line-2)',
      },
    },
    Textarea: {
      variants: {
        outline: {
          bg: 'var(--bg-0)',
          borderColor: 'var(--line)',
          borderRadius: '9px',
          color: 'var(--fg-0)',
          _focus: { borderColor: 'var(--line-2)', boxShadow: 'none' },
          _placeholder: { color: 'var(--fg-3)' },
        },
      },
    },
    Modal: {
      baseStyle: {
        overlay: {
          bg: 'rgba(8,12,22,0.72)',
          backdropFilter: 'blur(8px)',
        },
        dialog: {
          bg: 'var(--bg-1)',
          borderRadius: '16px',
          borderWidth: '1px',
          borderColor: 'var(--line-2)',
          boxShadow: 'none',
        },
        header: {
          fontFamily: 'heading',
          color: 'var(--fg-0)',
        },
        footer: {
          borderTopWidth: '0',
        },
        body: {
          color: 'var(--fg-1)',
        },
        closeButton: {
          color: 'var(--fg-2)',
          _hover: { bg: 'var(--bg-2)', color: 'var(--fg-0)' },
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'var(--bg-1)',
          borderWidth: '1px',
          borderColor: 'var(--line)',
        },
        item: {
          bg: 'var(--bg-1)',
          color: 'var(--fg-0)',
          _hover: { bg: 'var(--bg-2)' },
        },
      },
    },
    NumberInput: {
      variants: {
        outline: {
          field: {
            bg: 'var(--bg-0)',
            borderColor: 'var(--line)',
            borderRadius: '9px',
            color: 'var(--fg-0)',
            _focus: { borderColor: 'var(--line-2)', boxShadow: 'none' },
          },
        },
      },
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'var(--bg-0)',
            borderColor: 'var(--line)',
            borderRadius: '9px',
            color: 'var(--fg-0)',
          },
          icon: { color: 'var(--fg-2)' },
        },
      },
    },
    Checkbox: {
      baseStyle: {
        control: {
          borderColor: 'var(--line-2)',
          _checked: {
            bg: 'var(--blue)',
            borderColor: 'var(--blue-d)',
          },
          _focus: {
            boxShadow: 'none',
          },
        },
        label: { color: 'var(--fg-1)' },
      },
    },
    Radio: {
      baseStyle: {
        control: {
          borderColor: 'var(--line-2)',
          _checked: {
            bg: 'var(--blue)',
            borderColor: 'var(--blue-d)',
          },
        },
        label: { color: 'var(--fg-1)' },
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'var(--line)',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--fg-3)',
          },
          td: {
            borderColor: 'var(--line)',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        bg: 'var(--bg-2)',
        color: 'var(--fg-1)',
        borderWidth: '1px',
        borderColor: 'var(--line)',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      },
    },
    Divider: {
      baseStyle: {
        borderColor: 'var(--line)',
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
