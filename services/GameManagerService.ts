import { Match, Tile, User } from "@prisma/client"
import { IMatchDoc } from "../models/Match.model"
import { ITile } from "../models/Tile.model"
import { IUnitConstellation } from "../models/UnitConstellation.model"
import { MatchRich, MatchWithPlayers } from "../types/Match"

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

export const startMatch = async (
  matchId: string,
  userId: string,
  mapSize: number
) => {
  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "start",
      userId,
      settings: { rowCount: mapSize, columnCount: mapSize, maxTurns: 11 },
    }),
  }

  const response = await fetch(BASE_URL + "/match/" + matchId, options)

  if (response.status !== 200) {
    throw new Error("Failed to start match")
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

  return await response.json()
}
