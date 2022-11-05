import { Box, Flex, Heading, HStack, Stack, VStack } from "@chakra-ui/react"
import { Score } from "../models/Score.model"

import { getPlayerColor } from "./MapView"

export const ScoreView = (props: { scores: Score[]; players: string[] }) => {
  const viewPortWidthFactor = 0.06
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
              {props.scores[0].score}
            </Heading>
            <Box
              width={viewPortWidthFactor * 100 + "vw"}
              height={viewPortWidthFactor * 40 + "vw"}
              borderRadius={viewPortWidthFactor * 1 + "vw"}
              bg={getPlayerColor(props.players, props.scores[0].playerId)}
            />
          </HStack>
          <HStack
            key={props.scores[1].playerId}
            spacing={viewPortWidthFactor * 16 + "vw"}
          >
            <Box
              width={viewPortWidthFactor * 100 + "vw"}
              height={viewPortWidthFactor * 40 + "vw"}
              borderRadius={viewPortWidthFactor * 1 + "vw"}
              bg={getPlayerColor(props.players, props.scores[1].playerId)}
            />
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {props.scores[1].score}
            </Heading>
          </HStack>
        </HStack>
      </VStack>
    </Flex>
  )
}
