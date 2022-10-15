import type { NextPage } from "next"
import { Box, ChakraProvider, Flex, Text } from "@chakra-ui/react"
import { extendTheme } from "@chakra-ui/react"
import { useState } from "react"
import MapView from "../components/MapView"
import { GameSettings } from "../services/SettingsService"

const colors = {
  brand: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
  },
}

const theme = extendTheme({ colors })

const Game: NextPage = () => {
  const [status, setStatus] = useState("")
  return (
    <ChakraProvider theme={theme}>
      <Flex
        bg="gray.900"
        width="full"
        height="100vh"
        justify="center"
        align="center"
      >
        <Text color="gray.500" position="absolute" bottom="4" right="4">
          {status}
        </Text>
        <MapView
          rowCount={GameSettings.rowCount}
          columnCount={GameSettings.columnCount}
          onUpdateStatus={setStatus}
        />
      </Flex>
    </ChakraProvider>
  )
}

export default Game
