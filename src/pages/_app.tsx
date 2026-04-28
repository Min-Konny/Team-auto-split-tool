import { ChakraProvider } from '@chakra-ui/react'
import type { AppProps } from 'next/app'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import theme from '@/theme'
import '@/styles/tokens.css'

const inter = Inter({ subsets: ['latin'] })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${inter.className} ${mono.variable} ${display.variable}`}>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </div>
  )
}
