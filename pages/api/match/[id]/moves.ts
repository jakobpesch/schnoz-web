import { MatchStatus, UnitType } from "@prisma/client"
import type { NextApiRequest, NextApiResponse } from "next"
import { defaultGame } from "../../../../gameLogic/GameVariants"
import { Coordinate2D } from "../../../../models/UnitConstellation.model"
import { prisma } from "../../../../prisma/client"
import { MatchRich, matchRichInclude } from "../../../../types/Match"
import { TileRich } from "../../../../types/Tile"
import {
  translateCoordinatesTo,
  transformCoordinates,
} from "../../../../utils/constallationTransformer"
import {
  buildTileLookupId,
  getTileLookup,
} from "../../../../utils/coordinateUtils"
import { getCoordinateCircle } from "../../../../utils/coordinateUtils"

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

      if (match.status !== MatchStatus.STARTED) {
        res.status(500).end("Match is not started")
        break
      }

      if (match.activePlayerId !== participantId) {
        res.status(500).end("It's not your turn")
        break
      }

      const targetTile = match.map.tiles.find((tile: TileRich) => {
        return targetRow === tile.row && targetCol === tile.col
      })

      if (!targetTile) {
        res.status(500).end("Could not find target tile")
        break
      }

      const { coordinates, rotatedClockwise } = body.unitConstellation

      const transformedCoordinates = transformCoordinates(coordinates, {
        rotatedClockwise,
      })

      const targetTileCoordinate: Coordinate2D = [
        targetTile.row,
        targetTile.col,
      ]

      const translatedCoordinates = translateCoordinatesTo(
        targetTileCoordinate,
        transformedCoordinates
      )

      const canBePlaced = defaultGame.placementRules.every((rule) =>
        rule(translatedCoordinates, match!.map!, participantId)
      )

      if (!canBePlaced) {
        res.status(500).end("At least one tile cannot be placed.")
        break
      }

      let toBePlacedTiles = []
      let updateTilesPromises = []

      const visionCircle = getCoordinateCircle(3)
      const tileLookup = getTileLookup(match.map.tiles)
      for (let i = 0; i < translatedCoordinates.length; i++) {
        const coordinate = translatedCoordinates[i]
        const tile = tileLookup[buildTileLookupId(coordinate)]
        if (!tile) {
          res.status(500).end("Error while placing")
          break
        }
        const circleAroudUnit = translateCoordinatesTo(coordinate, visionCircle)
        for (let i = 0; i < circleAroudUnit.length; i++) {
          const coordinate = circleAroudUnit[i]
          const tile = tileLookup[buildTileLookupId(coordinate)]
          if (tile && !tile.visible) {
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
          }
        }

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
      }
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

      const tileLookupWithPlacedTiles = getTileLookup(
        matchWithPlacedTiles.map.tiles
      )

      const newScore = defaultGame.scoringRules.reduce((totalScore, rule) => {
        const ruleScore = rule(
          matchWithPlacedTiles!.activePlayerId!,
          tileLookupWithPlacedTiles
        )

        return totalScore + ruleScore
      }, 0)

      const winnerId = newScore >= 5 ? participantId : null

      await prisma.participant.update({
        where: { id: participantId },
        data: { score: newScore },
      })

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
          ...(winnerId
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
