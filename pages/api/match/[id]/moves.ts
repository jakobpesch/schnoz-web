import { MatchStatus, UnitType } from "@prisma/client"
import type { NextApiRequest, NextApiResponse } from "next"
import { defaultGame } from "../../../../gameLogic/GameVariants"
import Match from "../../../../models/Match.model"
import { Coordinate2D } from "../../../../models/UnitConstellation.model"
import { prisma } from "../../../../prisma/client"
import connectDb from "../../../../services/MongoService"
import { MatchRich, matchRichInclude } from "../../../../types/Match"
import { TileRich } from "../../../../types/Tile"
import {
  positionCoordinatesAt as translateCoordinatesTo,
  transformCoordinates,
} from "../../../../utils/constallationTransformer"
import { coordinateFromTileId } from "../../../../utils/coordinateUtils"

const increment = (x: number) => x + 1

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MatchRich>
) {
  const { body, method, query } = req
  let match: MatchRich | null
  const { participantId, row: targetRow, col: targetCol } = body
  const { id: matchId } = query

  if (!participantId || !targetRow || !targetCol) {
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
        console.log("not your turn")

        res
          .status(500)
          .end(
            "It's not your turn " + match.activePlayerId + " " + participantId
          )
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
      for (let i = 0; i < translatedCoordinates.length; i++) {
        const [row, col] = translatedCoordinates[i]
        const tileIndex = match.map.tiles.findIndex(
          (tile) => tile.row === row && tile.col === col
        )
        if (tileIndex === -1) {
          res.status(500).end("Error while placing")
          break
        }
        toBePlacedTiles.push()

        updateTilesPromises.push(
          prisma.tile.update({
            where: {
              id: match.map.tiles[tileIndex].id,
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

      const matchUpdateData: any = {}
      // const scoreIndex = match.scores.findIndex(
      //   (score) => score.playerId === match!.activePlayer
      // )

      // const tileLookup = getTileLookup(match.map.tiles)

      // const prevScore = match.scores[scoreIndex].score

      // const newScore =
      //   prevScore +
      //   defaultGame.scoringRules.reduce((totalScore, rule) => {
      //     const ruleScore = rule(
      //       match!.activePlayer,
      //       translatedCoordinates,
      //       tileLookup
      //     )

      //     return totalScore + ruleScore
      //   }, 0)

      // match.scores[scoreIndex] = {
      //   ...match.scores[scoreIndex],
      //   score: newScore,
      // }
      // match.winnerId = match.scores.find((score) => score.score >= 5)?.playerId

      // if (match.winnerId) {
      //   matchUpdateData.status = "finished"
      //   matchUpdateData.finishedAt = new Date()
      // }

      const activePlayerId = match.players.find(
        (player) => player.id !== match!.activePlayerId
      )?.id

      if (!activePlayerId) {
        res.status(500).end("Error while changing turns")
        break
      }
      matchUpdateData.activePlayerId = activePlayerId

      await Promise.all(updateTilesPromises)

      await prisma.match.update({
        where: { id: match.id },
        data: matchUpdateData,
      })

      match.turn = increment(match.turn)

      res.status(201).json(match)
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
