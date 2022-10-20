import { ITile } from "../models/Tile.model"

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api"
    : "https://schnoz-web-jakobpesch.vercel.app/api"

export const signInAnonymously = async () => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "false",
  }

  const response = await fetch(BASE_URL + "/users", options)
  return await response.json()
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

export const startGame = async (matchId: string, userId: string) => {
  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "start",
      userId,
      settings: { rowCount: 5, columnCount: 5, maxTurns: 3 },
    }),
  }

  const response = await fetch(BASE_URL + "/match/" + matchId, options)
  console.log(response.status)

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

export const getMatch = async (matchId: string) => {
  const options = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }

  const response = await fetch(BASE_URL + "/match/" + matchId, options)

  if (response.status !== 200) {
    throw new Error("Failed to create match")
  }

  return await response.json()
}

export const getMap = () => {
  console.log("getMap not yet implemented")
}

export const makeMove = async (
  matchId: string,
  tileId: ITile["id"],
  userId: string
) => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      tileId,
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
