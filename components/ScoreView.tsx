import { Divider, Flex, Heading, HStack, VStack } from "@chakra-ui/react"
import { Score } from "../models/Score.model"
import { getPlayerAppearance } from "../pages/match/[id]"

export const ScoreView = (props: { scores: Score[]; players: string[] }) => {
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
            key={props.scores[0].playerId}
            spacing={viewPortWidthFactor * 16 + "vw"}
          >
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {
                getPlayerAppearance(props.scores[0].playerId, props.players)
                  .unit
              }{" "}
              {props.scores[0].score}
            </Heading>
          </HStack>
          <Divider orientation="vertical"></Divider>
          <HStack
            key={props.scores[1].playerId}
            spacing={viewPortWidthFactor * 16 + "vw"}
          >
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {props.scores[1].score}{" "}
              {
                getPlayerAppearance(props.scores[1].playerId, props.players)
                  .unit
              }
            </Heading>
          </HStack>
        </HStack>
      </VStack>
    </Flex>
  )
}
