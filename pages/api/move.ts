// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import { Map } from "../../types/map"
import { PlayerId } from "../../types/player"
import { Tile } from "../../types/tile"

type MoveType = "place_unit"

type Data = {
  map: Map
  moveType: MoveType
  playerId: PlayerId
  tileId: Tile["id"]
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Map>
) {
  const {
    // @todo map should come from a database instead of the query
    body,
    method,
  } = req

  const { map: oldMap, moveType, playerId, tileId } = body

  if (!oldMap || !moveType || !playerId || !tileId) {
    res.status(500).end(`Query is not complete`)
  }

  switch (method) {
    case "POST":
      // Update or create data in your database
      const map: Map = oldMap as unknown as Map
      res.status(200).json(map)
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
