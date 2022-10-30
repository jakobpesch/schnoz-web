// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import Match, { IMatchDoc } from "../../../models/Match.model"
import Map from "../../../models/Map.model"
import Tile, { ITile } from "../../../models/Tile.model"
import connectDb from "../../../services/MongoService"
import { Terrain } from "../../../models/Terrain.model"

const getRandomTerrain = () => {
  const nullProbability = 10
  const waterProbability = 3
  const treeProbability = 3
  const stoneProbability = 1

  const probabilityArray = [
    ...Array(nullProbability).fill(null),
    ...Array(waterProbability).fill(Terrain.water),
    ...Array(treeProbability).fill(Terrain.tree),
    ...Array(stoneProbability).fill(Terrain.stone),
  ]

  const randomNumber = Math.random()
  const threshold = 1 / probabilityArray.length
  for (let i = 0; i < probabilityArray.length; i++) {
    if (randomNumber < i * threshold) {
      return probabilityArray[i]
    }
  }
  return null
}
const initialiseMap = (rowCount: number, columnCount: number) => {
  const safeArea = 5
  const rowIndices = [...Array(rowCount).keys()]
  const columnIndices = [...Array(columnCount).keys()]
  const tiles = [] as any
  rowIndices.forEach((row) => {
    columnIndices.forEach((col) => {
      const id = `${row}_${col}`
      const centerCoordinate = [
        Math.floor(rowCount / 2),
        Math.floor(columnCount / 2),
      ]
      const tilePayload: ITile = { id, row, col }
      if (
        Math.sqrt(
          (row - centerCoordinate[0]) ** 2 + (col - centerCoordinate[1]) ** 2
        ) > safeArea
      ) {
        tilePayload.terrain = getRandomTerrain()
      }

      if (centerCoordinate[0] === row && centerCoordinate[1] === col) {
        tilePayload.unit = {
          type: "mainBuilding",
        }
      }

      tiles.push(new Tile(tilePayload))
    })
  })

  return new Map({ rowCount, columnCount, tiles })
}
const checkConditionsForCreation = (
  match: IMatchDoc,
  userId: string,
  settings: any
) => {
  if (match.status === "started") {
    return { error: "Match has already started" }
  }

  if (match.createdBy !== userId) {
    return { error: "Only the match's creator can start the match" }
  }

  if (match.players.length < 2) {
    return { error: "Match is not full yet" }
  }

  const isEven = (x: number) => x % 2 === 0
  if (isEven(settings.rowCount)) {
    return { error: "Row count needs to be an odd integer" }
  }

  if (isEven(settings.columnCount)) {
    return { error: "Column count needs to be an odd integer" }
  }
  return { error: null }
}

const checkConditionsForJoining = (match: IMatchDoc) => {
  if (match.players.length === 2) {
    return { error: "Match already full" }
  }
  return { error: null }
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
      await connectDb()
      match = await Match.findById(matchId)

      if (match === null) {
        res.status(404).end(`Match with id ${matchId} not found.`)
        return
      }

      switch (body.action) {
        case "join":
          const { error: joinError } = checkConditionsForJoining(match)

          if (joinError) {
            res.status(500).end(joinError)
            break
          }

          match.players.push(body.userId)

          await match.save()
          res.status(200).json(match)
          break

        case "start":
          const { error: startError } = checkConditionsForCreation(
            match,
            body.userId,
            body.settings
          )

          if (startError) {
            res.status(500).end(startError)
            break
          }

          match.status = "started"
          match.map = initialiseMap(
            body.settings.rowCount,
            body.settings.columnCount
          )
          match.activePlayer = body.userId
          match.turn = 0
          match.maxTurns = body.settings.maxTurns

          await match.save()
          res.status(200).json(match)
          break
        default:
          res.status(500).end("Possible PUT actions: 'join', 'start'")
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
