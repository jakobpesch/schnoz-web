// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import connectDb from "../../../../services/MongoService"
import { Map } from "../../../../types/map"
import { PlayerId } from "../../../../types/player"
import { Tile } from "../../../../types/tile"
import Match from "../../../../models/Match.model"

type MoveType = "place_unit"

type Data = {
  map: Map
  moveType: MoveType
  playerId: PlayerId
  tileId: Tile["id"]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Map>
) {
  const { body, method } = req
  let match: any
  const { userId, tileId } = body

  if (!userId || !tileId) {
    res.status(500).end(`Query is not complete`)
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
      match.map.tiles[tileIndex] = {
        ...match.map.tiles[tileIndex],
        unit: { playerId: userId },
      }
      match.activePlayer = match.players.find(
        (playerId: string[]) => playerId !== match.activePlayer
      )
      await match.save()
      res.status(201).json(match)
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
