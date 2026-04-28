import { ChakraProvider } from '@chakra-ui/react'
import type { AppProps } from 'next/app'
import { Space_Grotesk, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google'
import theme from '@/theme'

import '@/styles/tokens.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${spaceGrotesk.className} ${notoSansJp.className} ${jetbrainsMono.className}`} style={{ minHeight: '100vh' }}>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </div>
  )
}
