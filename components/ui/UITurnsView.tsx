import { Flex, Heading, HStack, VStack } from "@chakra-ui/react"
import { Match, Participant } from "@prisma/client"
import assert from "assert"
import { useMemo } from "react"
import { defaultGame } from "../../gameLogic/GameVariants"
import { RenderSettings } from "../../services/SettingsService"
import { MatchRich } from "../../types/Match"

const getTurns = (match: MatchRich) => {
  const turnsUI: (
    | {
        turn: Match["turn"]
        playerId: Participant["id"]
        icon: string
        evaluate?: undefined
      }
    | {
        turn?: undefined
        playerId?: undefined
        icon?: undefined
        evaluate: true
      }
  )[] = []
  const startingPlayer = match.players.find(
    (player) => player.userId === match.createdById
  )
  assert(startingPlayer)

  let activePlayer = startingPlayer
  for (let turn = 1; turn <= match.maxTurns; turn++) {
    turnsUI.push({
      turn,
      playerId: activePlayer.id,
      icon: RenderSettings.getPlayerAppearance(activePlayer.playerNumber).unit,
    })

    if (defaultGame.shouldChangeActivePlayer(turn)) {
      activePlayer = match.players.find(
        (player) => player.id !== activePlayer.id
      )!
    }
    if (defaultGame.shouldEvaluate(turn)) {
      turnsUI.push({ evaluate: true })
    }
  }
  return turnsUI
}

export const UITurnsView = (props: { match: MatchRich }) => {
  const viewPortWidthFactor = 0.1

  const turnsUI = useMemo(() => {
    const turns = getTurns(props.match)
    for (let index = 1; index < props.match.turn; index++) {
      turns.shift()
      if (turns[0].evaluate) {
        turns.shift()
      }
    }
    return turns
  }, [props.match.updatedAt])

  return (
    <Flex position="fixed" top="0" left="0">
      <VStack
        bg="gray.700"
        borderWidth={viewPortWidthFactor * 1 + "vmin"}
        borderRadius={viewPortWidthFactor * 10 + "vmin"}
        spacing={viewPortWidthFactor * 16 + "vmin"}
        p={viewPortWidthFactor * 10 + "vmin"}
        m={viewPortWidthFactor * 10 + "vmin"}
      >
        <HStack position="relative" spacing={viewPortWidthFactor * 16 + "vmin"}>
          {turnsUI.map((turnUI, index) => {
            const borderStyle =
              index === 0
                ? {
                    borderRadius: "lg",
                    borderWidth: "3px",
                    borderColor: "green",
                    bg: "green.800",
                  }
                : {}
            if (turnUI.evaluate) {
              return (
                <Heading
                  key={index + "eval"}
                  textAlign="center"
                  fontSize={
                    index === 0
                      ? viewPortWidthFactor * 35 + "vmin"
                      : viewPortWidthFactor * 20 + "vmin"
                  }
                  {...borderStyle}
                >
                  ⭐️
                </Heading>
              )
            } else {
              return (
                <Heading
                  key={index + "player"}
                  textAlign="center"
                  fontSize={
                    index === 0
                      ? viewPortWidthFactor * 35 + "vmin"
                      : viewPortWidthFactor * 20 + "vmin"
                  }
                  {...borderStyle}
                >
                  {turnUI.icon}
                </Heading>
              )
            }
          })}
        </HStack>
      </VStack>
    </Flex>
  )
}
