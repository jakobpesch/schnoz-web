import { Divider, Flex, Heading, HStack, VStack } from "@chakra-ui/react"
import { Participant } from "@prisma/client"
import { Score } from "../models/Score.model"
import { getPlayerAppearance } from "../pages/match/[id]"

export const ScoreView = (props: { players: Participant[] }) => {
  const viewPortWidthFactor = 0.1
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
          <HStack
            key={props.players[0].id}
            spacing={viewPortWidthFactor * 16 + "vw"}
          >
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {
                getPlayerAppearance(
                  props.players[0].id,
                  props.players.map((player) => player.id)
                ).unit
              }{" "}
              {props.players[0].score}
            </Heading>
          </HStack>
          <Divider orientation="vertical"></Divider>
          <HStack
            key={props.players[1].id}
            spacing={viewPortWidthFactor * 16 + "vw"}
          >
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {props.players[1].score}{" "}
              {
                getPlayerAppearance(
                  props.players[1].id,
                  props.players.map((player) => player.id)
                ).unit
              }
            </Heading>
          </HStack>
        </HStack>
      </VStack>
    </Flex>
  )
}
