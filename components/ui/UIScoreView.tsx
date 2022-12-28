import { Divider, Flex, Heading, HStack, Stack, VStack } from "@chakra-ui/react"
import { Participant } from "@prisma/client"
import assert from "assert"
import { defaultGame } from "../../gameLogic/GameVariants"
import { RuleEvaluation, RuleType } from "../../gameLogic/ScoringRule"
import { Coordinate2D } from "../../models/UnitConstellation.model"
import { RenderSettings } from "../../services/SettingsService"
import { MapWithTiles } from "../../types/Map"
import { getTileLookup } from "../../utils/coordinateUtils"

const getEvaluationsMap = (map: MapWithTiles, players: Participant[]) => {
  const tileLookup = getTileLookup(map.tiles)
  const evaluationsMap = new Map<string, RuleEvaluation[]>()
  players.forEach((player) =>
    evaluationsMap.set(
      player.id,
      defaultGame.scoringRules.map((rule) => rule(player.id, tileLookup))
    )
  )
  return evaluationsMap
}

const getRuleAppearance = (ruleType: RuleType) => {
  if (ruleType === "water") {
    return "🧿"
  }
  if (ruleType === "hole") {
    return "🕳"
  }
  if (ruleType === "stone") {
    return "⚪️"
  }
}

export const UIScoreView = (props: {
  players: Participant[]
  map: MapWithTiles | null
  onRuleHover: (coordinates: Coordinate2D[]) => void
}) => {
  const viewPortWidthFactor = 0.1

  const player1 = props.players.find((player) => player.playerNumber === 0)
  assert(player1)

  const player2 = props.players.find((player) => player.playerNumber === 1)
  assert(player2)

  const evaluationsMap = props.map
    ? getEvaluationsMap(props.map, props.players)
    : null

  return (
    <Flex position="fixed" top="0" right="0">
      <VStack
        bg="gray.700"
        borderWidth={viewPortWidthFactor * 1 + "vw"}
        borderRadius={viewPortWidthFactor * 10 + "vw"}
        spacing={viewPortWidthFactor * 16 + "vw"}
        p={viewPortWidthFactor * 10 + "vw"}
        m={viewPortWidthFactor * 10 + "vw"}
      >
        <HStack spacing={viewPortWidthFactor * 16 + "vw"}>
          <HStack key={player1.id} spacing={viewPortWidthFactor * 16 + "vw"}>
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {RenderSettings.getPlayerAppearance(player1).unit} {player1.score}
            </Heading>
          </HStack>
          <Divider orientation="vertical"></Divider>
          <HStack key={player2.id} spacing={viewPortWidthFactor * 16 + "vw"}>
            <Heading fontSize={viewPortWidthFactor * 25 + "vw"} size="md">
              {player2.score} {RenderSettings.getPlayerAppearance(player2).unit}
            </Heading>
          </HStack>
        </HStack>
        <Divider />
        {evaluationsMap && (
          <Stack direction="row" spacing={viewPortWidthFactor * 16 + "vw"}>
            {Array.from(evaluationsMap.values()).map(
              (ruleEvaluations, index) => {
                return (
                  <Stack>
                    {ruleEvaluations.map((ruleEvaluation) => {
                      return (
                        <HStack
                          spacing={viewPortWidthFactor * 16 + "vw"}
                          color="white"
                        >
                          {index !== 0 && (
                            <Heading
                              fontSize={viewPortWidthFactor * 25 + "vw"}
                              size="md"
                            >
                              {getRuleAppearance(ruleEvaluation.type)}
                            </Heading>
                          )}
                          <Heading
                            fontSize={viewPortWidthFactor * 25 + "vw"}
                            size="md"
                            onMouseEnter={() =>
                              props.onRuleHover(
                                ruleEvaluation.fulfillments.flat()
                              )
                            }
                            onMouseLeave={() => props.onRuleHover([])}
                          >
                            {ruleEvaluation.points}
                          </Heading>
                        </HStack>
                      )
                    })}
                  </Stack>
                )
              }
            )}
          </Stack>
        )}
      </VStack>
    </Flex>
  )
}
