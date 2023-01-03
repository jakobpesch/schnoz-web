import {
  GameSettings,
  Map,
  Match,
  MatchStatus,
  Participant,
  User,
} from "@prisma/client"
import { defaultGame } from "../gameLogic/GameVariants"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../models/UnitConstellation.model"
import { MapWithTiles } from "../types/Map"
import { MatchRich, MatchWithPlayers } from "../types/Match"
import {
  transformCoordinates,
  translateCoordinatesTo,
} from "../utils/constallationTransformer"
import { buildTileLookupId, TileLookup } from "../utils/coordinateUtils"

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api"
    : "https://schnoz-web-jakobpesch.vercel.app/api"

export const signInAnonymously = async () => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }

  const response = await fetch(BASE_URL + "/users", options)
  const user: User = await response.json()
  return user
}

export const getMatches = async () => {
  const options = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }

  const response = await fetch(BASE_URL + "/matches", options)

  if (response.status !== 200) {
    throw new Error("Failed to get matches")
  }

  return await response.json()
}

export const startMatch = async (matchId: string, userId: string) => {
  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "start",
      userId,
    }),
  }

  const response = await fetch(BASE_URL + "/match/" + matchId, options)
  if (response.status !== 200) {
    throw new Error("Failed to start match")
  }

  return await response.json()
}

export const createMap = async (
  matchId: string,
  userId: string
): Promise<Map> => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      matchId,
    }),
  }

  const response = await fetch(BASE_URL + "/maps", options)

  if (response.status !== 201) {
    throw new Error("Failed to create map")
  }

  return await response.json()
}

export const joinMatch = async (matchId: string, userId: string) => {
  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "join",
      userId,
    }),
  }

  const response = await fetch(BASE_URL + "/match/" + matchId, options)

  if (response.status !== 200) {
    throw new Error("Failed to join match")
  }

  return await response.json()
}

export const createMatch = async (userId: string) => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
    }),
  }

  const response = await fetch(BASE_URL + "/matches", options)

  if (response.status !== 201) {
    throw new Error("Failed to create match")
  }
  const match: MatchWithPlayers = await response.json()
  return match
}

export const updateSettings: (args: {
  matchId: Match["id"]
  userId: Participant["userId"]
  mapSize: GameSettings["mapSize"]
  rules: GameSettings["rules"]
  maxTurns: GameSettings["maxTurns"]
  waterRatio: GameSettings["waterRatio"]
  stoneRatio: GameSettings["stoneRatio"]
  treeRatio: GameSettings["treeRatio"]
}) => Promise<MatchRich> = async (props) => {
  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: props.userId,
      mapSize: props.mapSize,
      rules: props.rules,
      maxTurns: props.maxTurns,
      waterRatio: props.waterRatio,
      stoneRatio: props.stoneRatio,
      treeRatio: props.treeRatio,
    }),
  }

  const response = await fetch(
    BASE_URL + "/match/" + props.matchId + "/settings",
    options
  )

  if (response.status !== 201) {
    throw new Error("Failed to update settings")
  }

  return await response.json()
}

export const deleteMatch = async (matchId: string, userId: string) => {
  const options = {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      matchId,
    }),
  }

  const response = await fetch(BASE_URL + "/match/" + matchId, options)

  if (response.status !== 200) {
    throw new Error("Failed to delete match")
  }

  return await response.json()
}

export const checkForMatchUpdates = async (matchId: string, time: Date) => {
  const options = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }

  const response = await fetch(
    BASE_URL + "/match/" + matchId + "/check?time=" + time,
    options
  )

  if (response.status === 304) {
    return null
  }

  const updatedMatch: MatchRich = (await response.json()).match

  return updatedMatch
}

export const getMatch = async (matchId: string) => {
  const options = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }

  const response = await fetch(BASE_URL + "/match/" + matchId, options)

  if (response.status !== 200) {
    throw new Error("Failed to create match")
  }

  const match: MatchRich = await response.json()

  return match
}

export const getMap = () => {
  console.log("getMap not yet implemented")
}

export const makeMove = async (
  matchId: string,
  row: number,
  col: number,
  participantId: string,
  unitConstellation: IUnitConstellation
) => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participantId,
      row,
      col,
      unitConstellation,
    }),
  }

  const response = await fetch(
    BASE_URL + "/match/" + matchId + "/moves",
    options
  )

  if (response.status !== 201) {
    throw new Error(await response.text())
  }
  const updatedMatch: MatchRich = await response.json()
  return updatedMatch
}

export const checkConditionsForUnitConstellationPlacement = (
  targetCoordinate: Coordinate2D,
  unitConstellation: IUnitConstellation,
  match: Match,
  map: MapWithTiles,
  tileLookup: TileLookup,
  placingPlayer: Participant["id"]
) => {
  if (!match) {
    return { error: { message: "Could not find match", statusCode: 400 } }
  }

  if (!map) {
    return { error: { message: "Map is missing", statusCode: 500 } }
  }

  if (match.status !== MatchStatus.STARTED) {
    return { error: { message: "Match is not started", statusCode: 400 } }
  }

  if (match.activePlayerId !== placingPlayer) {
    return { error: { message: "It's not your turn", statusCode: 400 } }
  }

  const targetTile = tileLookup[buildTileLookupId(targetCoordinate)]

  if (!targetTile) {
    return { error: { message: "Could not find target tile", statusCode: 400 } }
  }

  const { coordinates, rotatedClockwise } = unitConstellation

  const transformedCoordinates = transformCoordinates(coordinates, {
    rotatedClockwise,
  })

  const translatedCoordinates = translateCoordinatesTo(
    targetCoordinate,
    transformedCoordinates
  )

  const canBePlaced = defaultGame.placementRules.every((rule) =>
    rule(translatedCoordinates, map, placingPlayer)
  )

  if (!canBePlaced) {
    return {
      error: {
        message: "Cannot be placed due to a placement rule",
        statusCode: 400,
      },
    }
  }

  return { translatedCoordinates }
}
