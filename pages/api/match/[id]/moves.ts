// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import Match, { IMatch, IMatchDoc } from "../../../../models/Match.model"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../../../models/UnitConstellation.model"
import connectDb from "../../../../services/MongoService"
import {
  positionCoordinatesAt,
  transformCoordinates,
} from "../../../../utils/constallationTransformer"

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

      const { coordinates, rotatedClockwise }: IUnitConstellation =
        body.unitConstellation

      const transformedCoordinates = transformCoordinates(coordinates, {
        clockwiseRotationCount: rotatedClockwise,
      })

      const tileIndex = match.map.tiles.findIndex(
        (tile: any) => tileId === tile.id
      )

      const target: Coordinate2D = [
        match.map.tiles[tileIndex].row,
        match.map.tiles[tileIndex].col,
      ]

      const positionedCoordinates = positionCoordinatesAt(
        target,
        transformedCoordinates
      )

      let canPlace = true
      for (let i = 0; i < positionedCoordinates.length; i++) {
        const [row, col] = positionedCoordinates[i]
        console.log(row, col)

        const tileIndex = match.map.tiles.findIndex(
          (tile) => tile.row === row && tile.col === col
        )
        const isInBounds = tileIndex !== -1
        const hasUnit = !!match.map.tiles[tileIndex].unit
        const isPlaceable = isInBounds && !hasUnit
        if (!isInBounds || !isPlaceable) {
          canPlace = false
          break
        }

        match.map.tiles[tileIndex] = {
          ...match.map.tiles[tileIndex],
          unit: { playerId: userId },
        }
      }

      if (!canPlace) {
        res.status(500).end("At least one tile cannot be placed.")
        break
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

      const isGameFinished = match.turn > match.maxTurns
      if (isGameFinished) {
        match.status = "finished"
      }

      await match.save()
      res.status(201).json(match)
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
