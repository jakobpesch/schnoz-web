// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import Match from "../../../models/Match.model"
import Map from "../../../models/Map.model"
import Tile from "../../../models/Tile.model"
import connectDb from "../../../services/MongoService"
import mongoose from "mongoose"

const initialiseMap = (rowCount: number, columnCount: number) => {
  const rowIndices = [...Array(rowCount).keys()]
  const columnIndices = [...Array(columnCount).keys()]
  const tiles = [] as any
  rowIndices.forEach((iRow) => {
    columnIndices.forEach((iCol) => {
      const id = `${iRow}_${iCol}`
      tiles.push(new Tile({ id: id, row: iRow, col: iCol }))
    })
  })
  return new Map({ rowCount, columnCount, tiles })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body, method } = req
  let match
  switch (method) {
    case "PUT":
      switch (body.action) {
        case "join":
          await connectDb()
          match = await Match.findById(req.query.id)
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
          match = await Match.findById(req.query.id)
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
      // if (match.createdBy !== body.userId) {
      // }
      match = await Match.deleteOne({
        _id: req.query.id,
        createdBy: body.userId,
      })
      if (match.deletedCount === 0) {
        res.status(500).end("Only the createdBy can delete")
        break
      }
      res.status(200).json(match)
      break
    case "GET":
      await connectDb()
      console.log(req.query)
      const matchId = req.query.id

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
