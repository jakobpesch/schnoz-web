// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"

import {
  Match,
  MatchStatus,
  Participant,
  Prisma,
  Terrain,
  UnitType,
} from "@prisma/client"
import { Coordinate2D } from "../../../models/UnitConstellation.model"
import { prisma } from "../../../prisma/client"
import { matchRichInclude, MatchWithPlayers } from "../../../types/Match"
import { translateCoordinatesTo } from "../../../utils/constallationTransformer"
import {
  coordinateIncludedIn,
  coordinatesAreEqual,
  getCoordinateCircle,
} from "../../../utils/coordinateUtils"

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
const getInitialiseMapPayload = (rowCount: number, colCount: number) => {
  const centerCoordinate: Coordinate2D = [
    Math.floor(rowCount / 2),
    Math.floor(colCount / 2),
  ]

  const initialVisionRadius = 3
  const initialVision = translateCoordinatesTo(
    centerCoordinate,
    getCoordinateCircle(initialVisionRadius)
  )

  const saveAreaRadius = 2
  const safeArea = translateCoordinatesTo(
    centerCoordinate,
    getCoordinateCircle(saveAreaRadius)
  )

  const tilesCreatePayload: Prisma.TileCreateWithoutMapInput[] = []
  const rowIndices = [...Array(rowCount).keys()]
  const columnIndices = [...Array(colCount).keys()]
  rowIndices.forEach((row) => {
    columnIndices.forEach((col) => {
      const coordinate: Coordinate2D = [row, col]

      const tilePayload: Prisma.TileCreateWithoutMapInput = {
        row,
        col,
      }

      if (!coordinateIncludedIn(safeArea, coordinate)) {
        tilePayload.terrain = getRandomTerrain()
      }

      if (coordinateIncludedIn(initialVision, coordinate)) {
        tilePayload.visible = true
      }

      if (coordinatesAreEqual(coordinate, centerCoordinate)) {
        tilePayload.unit = {
          create: { type: UnitType.MAIN_BUILDING },
        }
      }

      tilesCreatePayload.push(tilePayload)
    })
  })

  const mapCreatePayload: Prisma.MapCreateWithoutMatchInput = {
    rowCount,
    colCount,
    tiles: { create: tilesCreatePayload },
  }

  return mapCreatePayload
}
const checkConditionsForCreation = (
  match: MatchWithPlayers,
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

const checkConditionsForJoining = (
  participants: Participant[],
  userId: string
) => {
  if (participants.length === 2) {
    return { error: "Match already full" }
  }
  if (participants.some((participant) => participant.userId === userId)) {
    return { error: "Cannot join twice" }
  }
  return { error: null }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body, method } = req
  let match: Match | null
  const matchId = req.query.id

  if (typeof matchId !== "string") {
    res.status(404).end(`Invalid match id provided: ${matchId}.`)
    return
  }

  switch (method) {
    case "PUT":
      const matchWithPlayers: MatchWithPlayers | null =
        await prisma.match.findUnique({
          where: { id: matchId },
          include: { players: true },
        })

      if (matchWithPlayers === null) {
        res.status(404).end(`Match with id ${matchId} not found.`)
        return
      }

      switch (body.action) {
        case "join":
          const { error: joinError } = checkConditionsForJoining(
            matchWithPlayers.players,
            body.userId
          )

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
            matchWithPlayers,
            body.userId,
            body.settings
          )

          if (startError) {
            res.status(500).end(startError)
            break
          }

          const status = MatchStatus.STARTED
          const startedAt = new Date()
          const mapCreatePayload = getInitialiseMapPayload(
            body.settings.rowCount,
            body.settings.columnCount
          )
          const activePlayerId = matchWithPlayers.players.find(
            (player) => player.userId === body.userId
          )?.id

          if (!activePlayerId) {
            res.status(500).end("Could not find active player")
            break
          }
          const turn = 0
          const maxTurns = body.settings.maxTurns

          const startedMatch = await prisma.match.update({
            where: { id: matchWithPlayers.id },
            data: {
              status,
              startedAt,
              activePlayerId,
              turn,
              maxTurns,
              map: {
                create: mapCreatePayload,
              },
            },
            include: matchRichInclude,
          })

          res.status(200).json(startedMatch)
          break
        default:
          res.status(500).end("Possible PUT actions: 'join', 'start'")
      }
      break
    case "DELETE":
      const deletedMatch = await prisma.match.delete({ where: { id: matchId } })

      if (!deletedMatch) {
        res.status(500).end("Match could not be deleted")
        break
      }
      res.status(200).json(deletedMatch)
      break
    case "GET":
      match = await prisma.match.findUnique({
        where: { id: matchId },
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
