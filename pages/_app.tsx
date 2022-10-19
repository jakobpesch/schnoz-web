import "../styles/globals.css"
import type { AppProps } from "next/app"
import { ChakraProvider, extendTheme } from "@chakra-ui/react"
import { theme as defaultTheme } from "@chakra-ui/react"
const config = {
  ...defaultTheme.config,
  initialColorMode: "dark",
  useSystemColorMode: false,
}

const theme = extendTheme({ ...defaultTheme, config })

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

export default MyApp
