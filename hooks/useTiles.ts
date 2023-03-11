import { useMemo } from "react"
import { Coordinate2D } from "../models/UnitConstellation.model"
import { MatchRich } from "../types/Match"
import {
  buildTileLookupId,
  getAdjacentCoordinates,
  getTileLookup,
} from "../utils/coordinateUtils"

export function useTiles(match?: MatchRich) {
  const tileLookup =
    useMemo(() => {
      return getTileLookup(match?.map?.tiles ?? [])
    }, [match?.updatedAt]) ?? []

  const terrainTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => tile.terrain && tile.visible)
    }, [match?.updatedAt]) ?? []

  const unitTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => tile.unit && tile.visible)
    }, [match?.updatedAt]) ?? []

  const fogTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => !tile.visible)
    }, [match?.updatedAt]) ?? []

  const halfFogTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => {
        if (!tile.visible) {
          return false
        }
        const coordinate: Coordinate2D = [tile.row, tile.col]
        const adjacentCoordinates = getAdjacentCoordinates(coordinate)
        const hasHiddenAdjacentTile = adjacentCoordinates.some(
          (adjacentCoordinate) => {
            const tile = tileLookup[buildTileLookupId(adjacentCoordinate)]
            if (!tile) {
              return false
            }
            return !tile.visible
          }
        )
        return tile.visible && hasHiddenAdjacentTile
      })
    }, [match?.updatedAt]) ?? []

  return {
    tileLookup,
    terrainTiles,
    unitTiles,
    fogTiles,
    halfFogTiles,
  }
}
