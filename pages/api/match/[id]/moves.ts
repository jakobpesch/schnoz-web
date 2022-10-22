// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import connectDb from "../../../../services/MongoService"
import { IMap } from "../../../../models/Map.model"
import Match from "../../../../models/Match.model"

export type MatchStatus = "created" | "started" | "finished"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IMap>
) {
  const { body, method } = req
  let match: any
  const { userId, tileId } = body

  if (!userId || !tileId) {
    res.status(500).end("Query is not complete")
    return
  }

  switch (method) {
    case "POST":
      // Create a new move
      await connectDb()
      match = await Match.findById(req.query.id)
      if (match.status !== "started") {
        res.status(500).end("Match is not started")
        break
      }
      if (match.activePlayer !== userId) {
        res.status(500).end("It's not your turn")
        break
      }
      const tileIndex = match.map.tiles.findIndex(
        (tile: any) => tile.id === tileId
      )

      if (match.map.tiles[tileIndex].unit) {
        res.status(500).end("Tile is blocked by another unit.")
        break
      }

      match.map.tiles[tileIndex] = {
        ...match.map.tiles[tileIndex],
        unit: { playerId: userId },
      }

      match.activePlayer = match.players.find(
        (playerId: string[]) => playerId !== match.activePlayer
      )

      match.turn = (match.turn ?? 0) + 1

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
