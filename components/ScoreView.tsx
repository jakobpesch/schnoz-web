import { Divider, Flex, Heading, HStack, VStack } from "@chakra-ui/react"
import { Participant } from "@prisma/client"
import assert from "assert"
import { getPlayerAppearance } from "../pages/match/[id]"

export const ScoreView = (props: { players: Participant[] }) => {
  const viewPortWidthFactor = 0.1
  const player1 = props.players.find((player) => player.playerNumber === 0)
  assert(player1)

  const player2 = props.players.find((player) => player.playerNumber === 1)
  assert(player2)

  return (
    <Flex width="full" justify="center" position="fixed" top="0" right="0">
      <VStack
        bg="gray.700"
        borderWidth={viewPortWidthFactor * 1 + "vw"}
        borderRadius={viewPortWidthFactor * 10 + "vw"}
        borderColor="gray.500"
        spacing={viewPortWidthFactor * 16 + "vw"}
        p={viewPortWidthFactor * 10 + "vw"}
        m={viewPortWidthFactor * 10 + "vw"}
      >
        <HStack spacing={viewPortWidthFactor * 16 + "vw"}>
          <HStack key={player1.id} spacing={viewPortWidthFactor * 16 + "vw"}>
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {getPlayerAppearance(player1).unit} {player1.score}
            </Heading>
          </HStack>
          <Divider orientation="vertical"></Divider>
          <HStack key={player2.id} spacing={viewPortWidthFactor * 16 + "vw"}>
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {player2.score} {getPlayerAppearance(player2).unit}
            </Heading>
          </HStack>
        </HStack>
      </VStack>
    </Flex>
  )
}
