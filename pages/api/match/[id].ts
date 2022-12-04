// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import Match, { IMatchDoc } from "../../../models/Match.model"
import Score from "../../../models/Score.model"
import Map from "../../../models/Map.model"
import { ITile } from "../../../models/Tile.model"
import connectDb from "../../../services/MongoService"

import { MatchRich, matchRichInclude } from "../../../types/Match"
import { MatchStatus, Terrain, Tile, UnitType } from "@prisma/client"
import { TileRich } from "../../../types/Tile"
import { prisma } from "../../../prisma/client"

const getRandomTerrain = () => {
  const nullProbability = 30
  const waterProbability = 3
  const treeProbability = 3
  const stoneProbability = 1

  const probabilityArray = [
    ...Array(nullProbability).fill(null),
    ...Array(waterProbability).fill(Terrain.WATER),
    ...Array(treeProbability).fill(Terrain.TREE),
    ...Array(stoneProbability).fill(Terrain.STONE),
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
  const safeArea = 3
  const rowIndices = [...Array(rowCount).keys()]
  const columnIndices = [...Array(columnCount).keys()]
  const tiles = [] as Tile[]
  rowIndices.forEach((row) => {
    columnIndices.forEach((col) => {
      const id = `${row}_${col}`
      const centerCoordinate = [
        Math.floor(rowCount / 2),
        Math.floor(columnCount / 2),
      ]
      const tilePayload: any = { row, col }
      if (
        Math.sqrt(
          (row - centerCoordinate[0]) ** 2 + (col - centerCoordinate[1]) ** 2
        ) > safeArea
      ) {
        tilePayload.terrain = getRandomTerrain()
      }

      if (centerCoordinate[0] === row && centerCoordinate[1] === col) {
        tilePayload.unit = {
          create: { type: UnitType.MAIN_BUILDING },
        }
      }

      tiles.push(tilePayload)
    })
  })

  return { rowCount, columnCount, tiles }
}
const checkConditionsForCreation = (
  match: MatchRich,
  userId: string,
  settings: any
) => {
  if (match.status === MatchStatus.STARTED) {
    return { error: "Match has already started" }
  }

  if (match.createdById !== userId) {
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

const checkConditionsForJoining = (match: MatchRich) => {
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
  let match: MatchRich | null
  const matchId = req.query.id

  if (typeof matchId !== "string") {
    res.status(404).end(`Invalid match id provided: ${matchId}.`)
    return
  }
  console.log(req.query.id)

  switch (method) {
    case "PUT":
      match = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchRichInclude,
      })

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

          const joinedMatch = await prisma.match.update({
            where: { id: matchId },
            data: {
              players: { create: { userId: body.userId, playerNumber: 1 } },
              updatedAt: new Date(),
            },
            include: matchRichInclude,
          })
          res.status(200).json(joinedMatch)
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

          const status = MatchStatus.STARTED
          const startedAt = new Date()
          const map = initialiseMap(
            body.settings.rowCount,
            body.settings.columnCount
          )
          const activePlayerId = match.players.find(
            (player) => player.userId === body.userId
          )?.id

          if (!activePlayerId) {
            res.status(500).end("Could not find active player")
            break
          }
          const turn = 0
          const maxTurns = body.settings.maxTurns

          const startedMatch = await prisma.match.update({
            where: { id: match.id },
            data: {
              status,
              startedAt,
              activePlayerId,
              turn,
              maxTurns,
              map: {
                create: {
                  rowCount: map.rowCount,
                  colCount: map.columnCount,
                  tiles: {
                    create: map.tiles,
                  },
                },
              },
            },
            include: matchRichInclude,
          })
          console.log(startedMatch)

          res.status(200).json(startedMatch)
          prisma.$disconnect()
          break
        default:
          res.status(500).end("Possible PUT actions: 'join', 'start'")
      }
      break
    case "DELETE":
      const deletedMatch = await prisma.match.delete({ where: { id: matchId } })
      console.log(deletedMatch)

      if (!deletedMatch) {
        res.status(500).end("Match could not be deleted")
        break
      }
      res.status(200).json(deletedMatch)
      break
    case "GET":
      match = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchRichInclude,
      })
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
