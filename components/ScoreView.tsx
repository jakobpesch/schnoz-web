import { Box, Heading, HStack, Stack } from "@chakra-ui/react"
import { Score } from "../models/Score.model"

import { getPlayerColor } from "./MapView"

export const ScoreView = (props: { scores: Score[]; players: string[] }) => {
  return (
    <Stack
      borderColor="gray.500"
      bg="gray.700"
      borderWidth="1px"
      borderRadius="lg"
      p="4"
      m="4"
      position="fixed"
      top="0"
      right="0"
    >
      <Heading size="lg">Score</Heading>
      {props.scores.map((score) => (
        <HStack key={score.playerId}>
          <Box
            width="16"
            height="8"
            borderRadius="md"
            bg={getPlayerColor(props.players, score.playerId)}
          />
          <Heading size="md">{score.score}</Heading>
        </HStack>
      ))}
    </Stack>
  )
}
