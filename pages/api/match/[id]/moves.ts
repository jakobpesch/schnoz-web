import {
  Match,
  MatchStatus,
  Participant,
  Prisma,
  Tile,
  UnitType,
} from "@prisma/client"
import assert from "assert"
import type { NextApiRequest, NextApiResponse } from "next"
import { defaultGame, GameType } from "../../../../gameLogic/GameVariants"
import { prisma } from "../../../../prisma/client"
import { checkConditionsForUnitConstellationPlacement } from "../../../../services/GameManagerService"
import { MatchRich, matchRichInclude } from "../../../../types/Match"
import {
  buildTileLookupId,
  getNewlyRevealedTiles,
  getTileLookup,
} from "../../../../utils/coordinateUtils"

const updatePlayerScores = (match: MatchRich, gameType: GameType) => {
  assert(match.map)
  console.log("number of players", match.players)

  const tileLookupWithPlacedTiles = getTileLookup(match.map.tiles)
  const updatedPlayers = match.players.map<Participant>((player) => {
    const newScore = gameType.scoringRules.reduce((totalScore, rule) => {
      const ruleScore = rule(player.id, tileLookupWithPlacedTiles)
      return totalScore + ruleScore
    }, 0)
    console.log("updatePlayerScore", player.playerNumber, newScore)

    return { ...player, score: newScore }
  })
  console.log(updatedPlayers)

  return updatedPlayers
}
const getLeadingPlayer = (match: MatchRich) => {
  const isSameScore = match.players.every((player) => {
    player.score === match.players[0].score
  })
  if (isSameScore) {
    return null
  }
  return (
    [...match.players]
      .sort((p1, p2) => {
        if (p1.score > p2.score) {
          return -1
        } else {
          return 1
        }
      })
      .shift() ?? null
  )
}

const maxScore = 5

const isLastTurn = (match: Match) => match.turn >= match.maxTurns - 1
const determineWinner = (match: MatchRich) => {
  const leadingPlayer = getLeadingPlayer(match)
  if (!leadingPlayer) {
    return null
  }
  if (leadingPlayer.score >= maxScore) {
    return leadingPlayer
  }
  if (!isLastTurn(match)) {
    return null
  }
  return leadingPlayer
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MatchRich>
) {
  const { body, method, query } = req
  let match: MatchRich | null
  const { participantId, row: targetRow, col: targetCol } = body
  const { id: matchId } = query

  if (
    !participantId ||
    typeof targetRow !== "number" ||
    typeof targetCol !== "number"
  ) {
    res.status(500).end("Query is not complete")
    return
  }

  if (typeof matchId !== "string") {
    res.status(404).end(`Invalid match id provided: ${matchId}.`)
    return
  }

  switch (method) {
    case "POST":
      // Create a new move
      match = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchRichInclude,
      })

      if (match === null) {
        res.status(500).end("Could not find match")
        break
      }

      if (!match.map) {
        res.status(500).end("Map is missing")
        break
      }

      const tileLookup = getTileLookup(match.map.tiles)
      const { translatedCoordinates, error } =
        checkConditionsForUnitConstellationPlacement(
          [targetRow, targetCol],
          body.unitConstellation,
          match,
          match.map,
          tileLookup,
          participantId
        )

      if (error) {
        res.status(error.statusCode).end(error.message)
        break
      }

      const { tiles: revealedTiles, error: revealedError } =
        getNewlyRevealedTiles(tileLookup, translatedCoordinates)

      if (revealedError) {
        res.status(revealedError.statusCode).end(revealedError.message)
        break
      }

      const updateTilesPromises: Prisma.Prisma__TileClient<Tile, never>[] = []
      translatedCoordinates.forEach((coordinate) => {
        const tile = tileLookup[buildTileLookupId(coordinate)]
        updateTilesPromises.push(
          prisma.tile.update({
            where: {
              id: tile.id,
            },
            data: {
              unit: {
                create: {
                  type: UnitType.UNIT,
                  ownerId: participantId,
                },
              },
            },
          })
        )
      })
      revealedTiles.forEach((tile) => {
        updateTilesPromises.push(
          prisma.tile.update({
            where: {
              id: tile.id,
            },
            data: {
              visible: true,
            },
          })
        )
      })
      await Promise.all(updateTilesPromises)
      const matchWithPlacedTiles = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchRichInclude,
      })

      if (
        !matchWithPlacedTiles ||
        !matchWithPlacedTiles.activePlayer ||
        !matchWithPlacedTiles.map
      ) {
        res.status(500).end("Match could not be fetched")
        break
      }

      if (!match.activePlayer) {
        res.status(500).end("Error while placing")
        break
      }

      const playersWithUpdatedScore = updatePlayerScores(
        matchWithPlacedTiles,
        defaultGame
      )

      const matchWithUpdatedScore = {
        ...match,
        players: playersWithUpdatedScore,
      }

      const winnerId = determineWinner(matchWithUpdatedScore)?.id ?? null
      console.log(playersWithUpdatedScore)

      for (let i = 0; i < playersWithUpdatedScore.length; i++) {
        const player = playersWithUpdatedScore[i]
        console.log("updateing player", player)

        await prisma.participant.update({
          where: { id: player.id },
          data: { score: player.score },
        })
      }

      const nextActivePlayerId = matchWithPlacedTiles.players.find(
        (player) => player.id !== matchWithPlacedTiles!.activePlayerId
      )?.id

      if (!nextActivePlayerId) {
        res.status(500).end("Error while changing turns")
        break
      }

      const updatedMatch = await prisma.match.update({
        where: { id: match.id },
        data: {
          activePlayerId: nextActivePlayerId,
          turn: { increment: 1 },
          ...(isLastTurn(match) || winnerId
            ? { winnerId, status: MatchStatus.FINISHED, finishedAt: new Date() }
            : {}),
        },
        include: matchRichInclude,
      })

      res.status(201).json(updatedMatch)
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
