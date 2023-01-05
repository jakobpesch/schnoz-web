import {
  Box,
  Divider,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { GameSettings, Participant, Rule, Terrain } from "@prisma/client"
import assert from "assert"
import { ReactNode } from "react"
import { createCustomGame } from "../../gameLogic/GameVariants"
import { RuleEvaluation } from "../../gameLogic/ScoringRule"
import { Coordinate2D } from "../../models/UnitConstellation.model"
import { RenderSettings } from "../../services/SettingsService"
import { MapWithTiles } from "../../types/Map"
import { getSquareMatrix, getTileLookup } from "../../utils/coordinateUtils"
import { HoveredTooltip } from "../HoveredTooltip"

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

const ruleExplainations = new Map<Rule, ReactNode>([
  [
    "TERRAIN_WATER_POSITIVE",
    (() => {
      const size = 50
      const radius = 2
      return (
        <Stack width={viewFactorWidth((radius * 2 + 1) * size)}>
          <Text fontSize={viewFactorWidth(20)}>
            Gain a rule point for each water tile that is touched by at least
            one of your units.
          </Text>
          <Flex
            overflow="hidden"
            flexWrap="wrap"
            position="relative"
            borderRadius={viewFactorWidth(10)}
          >
            {getSquareMatrix(radius).map((coordinate, index) => (
              <Box
                key={"tut_map_" + Rule.TERRAIN_WATER_POSITIVE + coordinate}
                minWidth={viewFactorWidth(size)}
                minHeight={viewFactorWidth(size)}
                maxWidth={viewFactorWidth(size)}
                maxHeight={viewFactorWidth(size)}
                bg={index % 2 === 0 ? "green.800" : "green.900"}
              />
            ))}
            {[
              [1, 0],
              [3, 3],
              [3, 1],
              [0, 4],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getPlayerAppearance(0).unit}
                  </Text>
                </Flex>
              )
            })}
            {[
              [1, 1],
              [1, 3],
              [3, 2],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getTerrainAppearance(Terrain.WATER)}
                  </Text>
                </Flex>
              )
            })}
            {[
              [1, 1],
              [3, 2],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="start"
                  justify="end"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text
                    textShadow="1px 1px 0px black,-1px -1px 0px black,1px -1px 0px black,-1px 1px 0px black;"
                    fontSize={viewFactorWidth(25)}
                  >
                    ⭐️
                  </Text>
                </Flex>
              )
            })}
          </Flex>
        </Stack>
      )
    })(),
  ],
  [
    "TERRAIN_STONE_NEGATIVE",
    (() => {
      const size = 50
      const radius = 2
      return (
        <Stack width={viewFactorWidth((radius * 2 + 1) * size)}>
          <Text fontSize={viewFactorWidth(20)}>
            Lose a rule point for each stone tile that is touched by at least
            one of your units.
          </Text>
          <Flex
            overflow="hidden"
            flexWrap="wrap"
            position="relative"
            borderRadius={viewFactorWidth(10)}
          >
            {getSquareMatrix(radius).map((coordinate, index) => (
              <Box
                key={"tut_map_" + Rule.TERRAIN_STONE_NEGATIVE + coordinate}
                minWidth={viewFactorWidth(size)}
                minHeight={viewFactorWidth(size)}
                maxWidth={viewFactorWidth(size)}
                maxHeight={viewFactorWidth(size)}
                bg={index % 2 === 0 ? "green.800" : "green.900"}
              />
            ))}
            {[
              [1, 0],
              [3, 3],
              [3, 1],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getPlayerAppearance(0).unit}
                  </Text>
                </Flex>
              )
            })}
            {[
              [1, 0],
              [3, 3],
              [3, 1],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getPlayerAppearance(0).unit}
                  </Text>
                </Flex>
              )
            })}
            {[
              [1, 1],
              [1, 3],
              [3, 2],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getTerrainAppearance(Terrain.STONE)}
                  </Text>
                </Flex>
              )
            })}
            {[
              [1, 1],
              [3, 2],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="start"
                  justify="end"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text
                    textShadow="1px 1px 0px black,-1px -1px 0px black,1px -1px 0px black,-1px 1px 0px black;"
                    fontSize={viewFactorWidth(25)}
                  >
                    💩
                  </Text>
                </Flex>
              )
            })}
          </Flex>
        </Stack>
      )
    })(),
  ],
  [
    "HOLE",
    (() => {
      const size = 50
      const radius = 2
      return (
        <Stack width={viewFactorWidth((radius * 2 + 1) * size)}>
          <Text fontSize={viewFactorWidth(20)}>
            Gain a rule point for each tile, that is only surrounded by allied
            units or terrain.
          </Text>
          <Text
            fontSize={viewFactorWidth(10)}
            fontStyle="italic"
            color="gray.400"
          >
            The main building in the center of the map counts as an allied unit.
            Also, the boundaries of the map make it easier to form holes.
          </Text>
          <Flex
            overflow="hidden"
            flexWrap="wrap"
            position="relative"
            borderRadius={viewFactorWidth(10)}
          >
            {getSquareMatrix(radius).map((coordinate, index) => (
              <Box
                key={"tut_map_" + Rule.HOLE + coordinate}
                minWidth={viewFactorWidth(size)}
                minHeight={viewFactorWidth(size)}
                maxWidth={viewFactorWidth(size)}
                maxHeight={viewFactorWidth(size)}
                bg={index % 2 === 0 ? "green.800" : "green.900"}
              />
            ))}
            {[
              [1, 0],
              [0, 1],
              [1, 2],
              [2, 1],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getPlayerAppearance(0).unit}
                  </Text>
                </Flex>
              )
            })}
            {[
              [0, 4],
              [1, 4],
              [0, 3],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getPlayerAppearance(1).unit}
                  </Text>
                </Flex>
              )
            })}
            {[[3, 2]].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getPlayerAppearance().unit}
                  </Text>
                </Flex>
              )
            })}
            {[[2, 3]].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getTerrainAppearance(Terrain.TREE)}
                  </Text>
                </Flex>
              )
            })}
            {[
              [0, 0],
              [1, 1],
              [2, 2],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text
                    textShadow="1px 1px 0px black,-1px -1px 0px black,1px -1px 0px black,-1px 1px 0px black;"
                    fontSize={viewFactorWidth(25)}
                  >
                    ⭐️
                  </Text>
                </Flex>
              )
            })}
          </Flex>
        </Stack>
      )
    })(),
  ],
  [
    "DIAGONAL_NORTHEAST",
    (() => {
      const size = 50
      const radius = 2
      return (
        <Stack width={viewFactorWidth((radius * 2 + 1) * size)}>
          <Text fontSize={viewFactorWidth(20)}>
            Gain a rule point for every diagonal from bottom-left to the
            top-right that constists of at least three units.
          </Text>
          <Text
            fontSize={viewFactorWidth(10)}
            fontStyle="italic"
            color="gray.400"
          >
            Note: Diagonals that go from the top-left to the bottom-right do not
            count! Also, extending the diagonal to four or more units does not
            give more points.
          </Text>
          <Flex
            overflow="hidden"
            flexWrap="wrap"
            position="relative"
            borderRadius={viewFactorWidth(10)}
          >
            {getSquareMatrix(radius).map((coordinate, index) => (
              <Box
                key={"tut_map_" + Rule.DIAGONAL_NORTHEAST + coordinate}
                minWidth={viewFactorWidth(size)}
                minHeight={viewFactorWidth(size)}
                maxWidth={viewFactorWidth(size)}
                maxHeight={viewFactorWidth(size)}
                bg={index % 2 === 0 ? "green.800" : "green.900"}
              />
            ))}
            {[
              [0, 0],
              [1, 1],
              [2, 2],

              [3, 0],
              [2, 1],
              [1, 2],

              [4, 0],
              [3, 1],
              [2, 2],
              [1, 3],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getPlayerAppearance(0).unit}
                  </Text>
                </Flex>
              )
            })}
            {[[2, 3]].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text fontSize={viewFactorWidth(40)}>
                    {RenderSettings.getTerrainAppearance(Terrain.TREE)}
                  </Text>
                </Flex>
              )
            })}
            <Flex
              position="absolute"
              align="center"
              justify="center"
              top={viewFactorWidth(0.5 * size)}
              left={viewFactorWidth(0.5 * size)}
              width={viewFactorWidth(
                Math.sqrt((2 * size) ** 2 + (2 * size) ** 2)
              )}
              height={viewFactorWidth(3 * size)}
              borderBottomWidth="5px"
              borderColor="yellow.300"
              transform={"rotate(-45deg)"}
              transformOrigin="left bottom"
              pointerEvents="none"
            />
            <Flex
              position="absolute"
              align="center"
              justify="center"
              top={viewFactorWidth(1.5 * size)}
              left={viewFactorWidth(0.5 * size)}
              width={viewFactorWidth(
                Math.sqrt((3 * size) ** 2 + (3 * size) ** 2)
              )}
              height={viewFactorWidth(3 * size)}
              borderBottomWidth="5px"
              borderColor="yellow.300"
              transform={"rotate(-45deg)"}
              transformOrigin="left bottom"
              pointerEvents="none"
            />
            {[
              [2, 1],
              [2.5, 1.5],
            ].map(([row, col]) => {
              return (
                <Flex
                  key={row + "_" + col}
                  position="absolute"
                  align="center"
                  justify="center"
                  top={viewFactorWidth(row * size)}
                  left={viewFactorWidth(col * size)}
                  width={viewFactorWidth(size)}
                  height={viewFactorWidth(size)}
                  pointerEvents="none"
                >
                  <Text
                    textShadow="1px 1px 0px black,-1px -1px 0px black,1px -1px 0px black,-1px 1px 0px black;"
                    fontSize={viewFactorWidth(25)}
                  >
                    ⭐️
                  </Text>
                </Flex>
              )
            })}
          </Flex>
        </Stack>
      )
    })(),
  ],
])

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
                      <HoveredTooltip
                        trigger={
                          <Heading
                            minWidth={viewFactorWidth(30)}
                            textAlign="center"
                            cursor="default"
                            fontSize={viewFactorWidth(25)}
                          >
                            {RenderSettings.getRuleAppearance(
                              ruleEvaluations[0].type
                            )}
                          </Heading>
                        }
                        header={
                          <Heading fontSize={viewFactorWidth(25)}>
                            {RenderSettings.getRuleAppearance(
                              ruleEvaluations[0].type
                            )}{" "}
                            {RenderSettings.getRuleName(
                              ruleEvaluations[0].type
                            )}
                          </Heading>
                        }
                        body={ruleExplainations.get(ruleEvaluations[0].type)}
                      />

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
