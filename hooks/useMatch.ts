import {
  GameSettings,
  Map as SchnozMap,
  Match,
  Participant,
  User,
} from "@prisma/client"
import { useEffect, useState } from "react"
import { socketApi } from "../services/SocketService"
import { TileWithUnit } from "../types/Tile"
import { coordinatesAreEqual } from "../utils/coordinateUtils"

export function useMatch(userId: User["id"], matchId: Match["id"]) {
  const [match, setMatch] = useState<Match>()
  const [gameSettings, setGameSettings] = useState<GameSettings>()
  const [map, setMap] = useState<SchnozMap>()
  const [updatedTilesWithUnits, setUpdatedTilesWithUnits] =
    useState<TileWithUnit[]>()
  const [tilesWithUnits, setTilesWithUnits] = useState<TileWithUnit[]>()
  const [players, setPlayers] = useState<Participant[]>()

  useEffect(() => {
    if (!updatedTilesWithUnits || !tilesWithUnits) {
      return
    }
    const tilesWithUnitsClone = [...tilesWithUnits]
    updatedTilesWithUnits.forEach((updatedTileWithUnit) => {
      const index = tilesWithUnits?.findIndex((t) =>
        coordinatesAreEqual(
          [t.row, t.col],
          [updatedTileWithUnit.row, updatedTileWithUnit.col]
        )
      )
      if (!index) {
        tilesWithUnitsClone.push(updatedTileWithUnit)
        return
      }
      tilesWithUnitsClone[index] = updatedTileWithUnit
    })
    setTilesWithUnits(tilesWithUnitsClone)
  }, [updatedTilesWithUnits])

  useEffect(() => {
    if (socketApi.isConnected) {
      return
    }
    if (!userId || !matchId) {
      return
    }
    if (!socketApi.isConnected) {
      socketApi.setCallbacks({
        setMatch,
        setGameSettings,
        setMap,
        setTilesWithUnits,
        setUpdatedTilesWithUnits,
        setPlayers,
      })
      socketApi.connectToMatch(userId, matchId)
    }
  }, [matchId, userId])
  return {
    match,
    gameSettings,
    map,
    tilesWithUnits,
    updatedTilesWithUnits,
    players,
  }
}
