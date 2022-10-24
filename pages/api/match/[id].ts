// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import Match, { IMatchDoc } from "../../../models/Match.model"
import Map from "../../../models/Map.model"
import Tile, { ITile } from "../../../models/Tile.model"
import connectDb from "../../../services/MongoService"
import mongoose from "mongoose"

const initialiseMap = (rowCount: number, columnCount: number) => {
  const rowIndices = [...Array(rowCount).keys()]
  const columnIndices = [...Array(columnCount).keys()]
  const tiles = [] as any
  rowIndices.forEach((row) => {
    columnIndices.forEach((col) => {
      const id = `${row}_${col}`
      const tilePayload: ITile = { id, row, col }
      if (
        row == Math.floor(rowCount / 2) &&
        col == Math.floor(columnCount / 2)
      ) {
        tilePayload.unit = {
          type: "mainBuilding",
        }
        console.log(tilePayload)
      }

      tiles.push(new Tile(tilePayload))
    })
  })
  return new Map({ rowCount, columnCount, tiles })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body, method } = req
  let match: IMatchDoc | null
  const matchId = req.query.id

  switch (method) {
    case "PUT":
      switch (body.action) {
        case "join":
          await connectDb()
          match = await Match.findById(matchId)

          if (match === null) {
            res.status(500).end("Match could not be found")
            break
          }

          if (match.players.length === 2) {
            res.status(500).end("Match already full")
            break
          }

          match.players.push(body.userId)

          await match.save()
          res.status(200).json(match)
          break
        case "start":
          await connectDb()
          match = await Match.findById(matchId)

          if (match === null) {
            res.status(500).end("Match could not be found")
            break
          }

          if (match.status === "started") {
            res.status(500).end("Match has already started")
            break
          }

          if (match.createdBy !== body.userId) {
            res.status(500).end("Only the match's creator can start the match")
            break
          }

          if (match.players.length < 2) {
            res.status(500).end("Match is not full yet")
            break
          }

          match.map = initialiseMap(
            body.settings.rowCount,
            body.settings.columnCount
          )

          const isEven = (x: number) => x % 2 === 0
          if (isEven(match.map.rowCount)) {
            res.status(500).end("Row count needs to be an odd integer")
            break
          }

          if (isEven(match.map.columnCount)) {
            res.status(500).end("Column count needs to be an odd integer")
            break
          }

          match.status = "started"
          match.activePlayer = body.userId
          match.turn = 0
          match.maxTurns = body.settings.maxTurns
          await match.save()
          res.status(200).json(match)
      }
      break
    case "DELETE":
      await connectDb()

      const deletedMatch = await Match.deleteOne({
        _id: matchId,
        createdBy: body.userId,
      })

      if (deletedMatch.deletedCount === 0) {
        res.status(500).end("Match could not be deleted")
        break
      }
      res.status(200).json(deletedMatch)
      break
    case "GET":
      await connectDb()

      if (
        !matchId ||
        typeof matchId !== "string" ||
        !mongoose.Types.ObjectId.isValid(matchId)
      ) {
        console.log("falsey match id", matchId)
      }

      match = await Match.findById(matchId)

      if (!match) {
        res.status(404).end(`Match with id ${matchId} not found.`)
        break
      }

      res.status(200).json(match)
      break
    default:
      res.setHeader("Allow", ["POST", "GET", "DELETE"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
