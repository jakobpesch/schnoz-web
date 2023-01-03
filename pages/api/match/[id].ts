// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"

import {
  GameSettings,
  Match,
  MatchStatus,
  Participant,
  Prisma,
  Terrain,
  UnitConstellation,
  UnitType,
} from "@prisma/client"
import { Coordinate2D } from "../../../models/UnitConstellation.model"
import { prisma } from "../../../prisma/client"
import { matchRichInclude, MatchRich } from "../../../types/Match"
import { translateCoordinatesTo } from "../../../utils/constallationTransformer"
import {
  coordinateIncludedIn,
  coordinatesAreEqual,
  getCoordinateCircle,
} from "../../../utils/coordinateUtils"
import { shuffleArray } from "../../../utils/arrayUtils"

const getRandomTerrain = (gameSettings: GameSettings) => {
  const nullProbability = 30
  const waterProbability = gameSettings.waterRatio
  const treeProbability = gameSettings.treeRatio
  const stoneProbability = gameSettings.stoneRatio

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
const getInitialiseMapPayload = (gameSettings: GameSettings) => {
  const halfMapSize = Math.floor(gameSettings.mapSize / 2)
  const centerCoordinate: Coordinate2D = [halfMapSize, halfMapSize]

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
  const indices = [...Array(gameSettings.mapSize).keys()]

  indices.forEach((row) => {
    indices.forEach((col) => {
      const coordinate: Coordinate2D = [row, col]

      const tilePayload: Prisma.TileCreateWithoutMapInput = {
        row,
        col,
      }

      if (!coordinateIncludedIn(safeArea, coordinate)) {
        tilePayload.terrain = getRandomTerrain(gameSettings)
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
    rowCount: gameSettings.mapSize,
    colCount: gameSettings.mapSize,
    tiles: { create: tilesCreatePayload },
  }

  return mapCreatePayload
}
const checkConditionsForCreation = (match: MatchRich, userId: string) => {
  if (match.status === MatchStatus.STARTED) {
    return { error: "Match has already started" }
  }

  if (match.createdById !== userId) {
    return { error: "Only the match's creator can start the match" }
  }

  if (match.players.length < 2) {
    return { error: "Match is not full yet" }
  }
  if (!match.gameSettings) {
    return { error: "No game settings" }
  }

  const isEven = (x: number) => x % 2 === 0
  if (isEven(match.gameSettings.mapSize)) {
    return { error: "mapSize needs to be an odd integer" }
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
      const matchRich = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchRichInclude,
      })

      if (matchRich === null) {
        res.status(404).end(`Match with id ${matchId} not found.`)
        return
      }
      if (matchRich.gameSettings === null) {
        res.status(500).end("Settings missing")
        return
      }

      switch (body.action) {
        case "join":
          const { error: joinError } = checkConditionsForJoining(
            matchRich.players,
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
            matchRich,
            body.userId
          )

          if (startError) {
            res.status(500).end(startError)
            break
          }

          const status = MatchStatus.STARTED
          const startedAt = new Date()
          const mapCreatePayload = getInitialiseMapPayload(
            matchRich.gameSettings
          )
          const activePlayerId = matchRich.players.find(
            (player) => player.userId === body.userId
          )?.id

          if (!activePlayerId) {
            res.status(500).end("Could not find active player")
            break
          }
          const turn = 1

          const openCards = shuffleArray<UnitConstellation>(
            Object.values({ ...UnitConstellation })
          ).slice(0, 3)

          const startedMatch = await prisma.match.update({
            where: { id: matchRich.id },
            data: {
              openCards,
              status,
              startedAt,
              activePlayerId,
              turn,
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
