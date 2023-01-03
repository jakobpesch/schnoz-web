import { Divider, Flex, Heading, HStack, Stack, VStack } from "@chakra-ui/react"
import { GameSettings, Participant, Rule } from "@prisma/client"
import assert from "assert"
import { createCustomGame } from "../../gameLogic/GameVariants"
import { RuleEvaluation } from "../../gameLogic/ScoringRule"
import { Coordinate2D } from "../../models/UnitConstellation.model"
import { RenderSettings } from "../../services/SettingsService"
import { MapWithTiles } from "../../types/Map"
import { getTileLookup } from "../../utils/coordinateUtils"

export const viewFactorWidth = (
  value: number,
  viewPortWidthFactor: number = 0.1
) => viewPortWidthFactor * value + "vmin"

const getEvaluationsMap = (
  map: MapWithTiles,
  players: Participant[],
  rules: GameSettings["rules"]
) => {
  const tileLookup = getTileLookup(map.tiles)
  const rulesMap = new Map<Rule, RuleEvaluation[]>()
  const gameType = createCustomGame(rules)
  gameType.scoringRules.forEach((rule) => {
    const evals = players
      .sort((a, b) => a.playerNumber - b.playerNumber)
      .map((player) => rule(player.id, tileLookup))
    rulesMap.set(evals[0].type, evals)
  })
  const evaluationsMap = new Map<string, RuleEvaluation[]>()
  players.forEach((player) =>
    evaluationsMap.set(
      player.id,
      gameType.scoringRules.map((rule) => rule(player.id, tileLookup))
    )
  )

  return rulesMap
}

export const UIScoreView = (props: {
  players: Participant[]
  map: MapWithTiles | null
  rules: GameSettings["rules"]
  onRuleHover: (coordinates: Coordinate2D[]) => void
}) => {
  const player1 = props.players.find((player) => player.playerNumber === 0)
  assert(player1)

  const player2 = props.players.find((player) => player.playerNumber === 1)
  assert(player2)

  const rulesMap = props.map
    ? getEvaluationsMap(props.map, props.players, props.rules)
    : null

  return (
    <Flex position="fixed" top="0" right="0">
      <VStack
        bg="gray.700"
        borderWidth={viewFactorWidth(1)}
        borderRadius={viewFactorWidth(10)}
        spacing={viewFactorWidth(10)}
        p={viewFactorWidth(10)}
        m={viewFactorWidth(10)}
      >
        <HStack spacing={viewFactorWidth(16)}>
          <HStack key={player1.id} spacing={viewFactorWidth(16)}>
            <Heading fontSize={viewFactorWidth(25)} size="md">
              {RenderSettings.getPlayerAppearance(player1.playerNumber).unit}{" "}
              {player1.score}
            </Heading>
          </HStack>
          <Divider orientation="vertical"></Divider>
          <HStack key={player2.id} spacing={viewFactorWidth(16)}>
            <Heading fontSize={viewFactorWidth(25)} size="md">
              {player2.score}{" "}
              {RenderSettings.getPlayerAppearance(player2.playerNumber).unit}
            </Heading>
          </HStack>
        </HStack>
        <Divider />
        {rulesMap && (
          <Stack spacing={viewFactorWidth(5)}>
            {Array.from(rulesMap.values()).map(
              (ruleEvaluations, ruleEvalsIndex) => {
                return (
                  <VStack
                    key={"ruleEvals_" + ruleEvalsIndex}
                    p={viewFactorWidth(5)}
                    borderRadius="lg"
                    bg={
                      ruleEvaluations[0].points === ruleEvaluations[1].points
                        ? "none"
                        : ruleEvaluations[0].points > ruleEvaluations[1].points
                        ? RenderSettings.getPlayerAppearance(
                            player1.playerNumber
                          ).color
                        : RenderSettings.getPlayerAppearance(
                            player2.playerNumber
                          ).color
                    }
                  >
                    <HStack spacing={viewFactorWidth(16)} color="white">
                      <Heading
                        minWidth={viewFactorWidth(30)}
                        textAlign="center"
                        cursor="default"
                        fontSize={viewFactorWidth(25)}
                        size="md"
                        onMouseEnter={() =>
                          props.onRuleHover(
                            ruleEvaluations[0].fulfillments.flat()
                          )
                        }
                        onMouseLeave={() => props.onRuleHover([])}
                      >
                        {ruleEvaluations[0].points}
                      </Heading>
                      <Heading
                        minWidth={viewFactorWidth(30)}
                        textAlign="center"
                        cursor="default"
                        fontSize={viewFactorWidth(25)}
                        size="md"
                      >
                        {RenderSettings.getRuleAppearance(
                          ruleEvaluations[0].type
                        )}
                      </Heading>
                      <Heading
                        minWidth={viewFactorWidth(30)}
                        textAlign="center"
                        cursor="default"
                        fontSize={viewFactorWidth(25)}
                        size="md"
                        onMouseEnter={() =>
                          props.onRuleHover(
                            ruleEvaluations[1].fulfillments.flat()
                          )
                        }
                        onMouseLeave={() => props.onRuleHover([])}
                      >
                        {ruleEvaluations[1].points}
                      </Heading>
                    </HStack>
                  </VStack>
                )
              }
            )}
          </Stack>
        )}
      </VStack>
    </Flex>
  )
}
