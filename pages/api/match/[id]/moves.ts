import type { NextApiRequest, NextApiResponse } from "next"
import { defaultGame } from "../../../../gameLogic/GameVariants"
import Match, { IMatch, IMatchDoc } from "../../../../models/Match.model"
import { ITile } from "../../../../models/Tile.model"
import { Coordinate2D } from "../../../../models/UnitConstellation.model"
import connectDb from "../../../../services/MongoService"
import {
  positionCoordinatesAt as translateCoordinatesTo,
  transformCoordinates,
} from "../../../../utils/constallationTransformer"
import { getTileLookup } from "../../../../utils/coordinateUtils"

export type MatchStatus = "created" | "started" | "finished"

const increment = (x: number) => x + 1

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IMatch>
) {
  const { body, method } = req
  let match: IMatchDoc | null
  const { userId, tileId } = body

  if (!userId || !tileId) {
    res.status(500).end("Query is not complete")
    return
  }

  switch (method) {
    case "POST":
      // Create a new move
      await connectDb()
      match = await Match.findById(req.query.id).exec()

      if (match === null) {
        res.status(500).end("Could not find match")
        break
      }

      if (match.status !== "started") {
        res.status(500).end("Match is not started")
        break
      }
      if (match.activePlayer !== userId) {
        res.status(500).end("It's not your turn")
        break
      }

      let targetTile = match.map.tiles.find(
        (tile: ITile) => body.tileId === tile.id
      )

      if (!targetTile) {
        return false
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
        rule(translatedCoordinates, match!.map, userId)
      )

      if (!canBePlaced) {
        res.status(500).end("At least one tile cannot be placed.")
        break
      }

      for (let i = 0; i < translatedCoordinates.length; i++) {
        const [row, col] = translatedCoordinates[i]
        const tileIndex = match.map.tiles.findIndex(
          (tile) => tile.row === row && tile.col === col
        )
        if (tileIndex === -1) {
          res.status(500).end("Error while placing")
          break
        }

        // mongoose saves it only this way *shrug*
        match.map.tiles[tileIndex] = {
          ...match.map.tiles[tileIndex],
          unit: { type: "playerUnit", playerId: userId },
        }
      }
      const scoreIndex = match.scores.findIndex(
        (score) => score.playerId === match!.activePlayer
      )

      const tileLookup = getTileLookup(match.map.tiles)

      const prevScore = match.scores[scoreIndex].score

      const newScore =
        prevScore +
        defaultGame.scoringRules.reduce((totalScore, rule) => {
          const ruleScore = rule(
            match!.activePlayer,
            translatedCoordinates,
            tileLookup
          )

          return totalScore + ruleScore
        }, 0)

      match.scores[scoreIndex] = {
        ...match.scores[scoreIndex],
        score: newScore,
      }

      const activePlayer = match.players.find(
        (playerId) => playerId !== match!.activePlayer
      )
      if (!activePlayer) {
        res.status(500).end("Error while changing turns")
        break
      }
      match.activePlayer = activePlayer

      match.turn = increment(match.turn)

      match.winner = match.scores.find((score) => score.score >= 5)?.playerId

      if (match.winner) {
        match.status = "finished"
        match.finishedAt = new Date()
      }

      await match.save()
      res.status(201).json(match)
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
