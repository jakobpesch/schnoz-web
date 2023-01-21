import { Flex, Heading, HStack, Stack } from "@chakra-ui/react"
import { MatchRich } from "../../types/Match"
import { viewFactorWidth } from "./UIScoreView"

export const UIBonusPointsView = (props: { match: MatchRich }) => {
  return (
    <Flex position="fixed" top={viewFactorWidth(100)} left="0">
      <Stack
        bg="gray.700"
        borderWidth={viewFactorWidth(1)}
        borderRadius={viewFactorWidth(10)}
        spacing={viewFactorWidth(16)}
        p={viewFactorWidth(10)}
        m={viewFactorWidth(10)}
        maxWidth="50vw"
        overflowX="hidden"
      >
        <HStack position="relative" spacing={viewFactorWidth(16)}>
          <Heading textAlign="center" fontSize={viewFactorWidth(35)}>
            {props.match.activePlayer?.bonusPoints} 🟡
          </Heading>
        </HStack>
      </Stack>
    </Flex>
  )
}
