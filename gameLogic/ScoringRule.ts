import { Terrain, UnitType } from "@prisma/client"
import { Coordinate2D } from "../models/UnitConstellation.model"
import {
  buildTileLookupId,
  getAdjacentCoordinatesOfConstellation,
  TileLookup,
} from "../utils/coordinateUtils"

type ScoringRule = (
  playerId: string,
  coordinates: Coordinate2D[],
  tileLookup: TileLookup
) => number

export const waterRule: ScoringRule = (playerId, coordinates, tileLookup) => {
  const adjacentCoordinates = getAdjacentCoordinatesOfConstellation(coordinates)
  const adjacentWaterCoordinates = adjacentCoordinates.filter((coordinate) => {
    return (
      tileLookup[buildTileLookupId(coordinate)]?.terrain === Terrain.WATER ??
      false
    )
  })
  const scoredPoints = adjacentWaterCoordinates.length
  return scoredPoints
}

export const stoneRule: ScoringRule = (playerId, coordinates, tileLookup) => {
  const adjacentCoordinates = getAdjacentCoordinatesOfConstellation(coordinates)

  const adjacentStoneCoordinates = adjacentCoordinates.filter((coordinate) => {
    return (
      tileLookup[buildTileLookupId(coordinate)]?.terrain === Terrain.STONE ??
      false
    )
  })
  const scoredPoints = -adjacentStoneCoordinates.length
  return scoredPoints
}

export const holeRule: ScoringRule = (playerId, coordinates, tileLookup) => {
  const adjacentCoordinatesOfConstellation =
    getAdjacentCoordinatesOfConstellation(coordinates)

  const scoredPoints = adjacentCoordinatesOfConstellation.reduce(
    (score, potentialHoleCoordinate) => {
      const potentialHoleTile =
        tileLookup[buildTileLookupId(potentialHoleCoordinate)]

      if (!potentialHoleTile) {
        return score
      }

      const isFree = !potentialHoleTile.terrain && !potentialHoleTile.unit

      if (!isFree) {
        return score
      }

      const adjacentsToPotentialHole = getAdjacentCoordinatesOfConstellation([
        potentialHoleCoordinate,
      ])

      const adjacentTiles = adjacentsToPotentialHole
        .map((coordinate) => tileLookup[buildTileLookupId(coordinate)] ?? null)
        .filter((tile) => !!tile)

      const allAlly = adjacentTiles.every((tile) => {
        const isAlly =
          tile.unit?.ownerId === playerId ||
          tile.unit?.type === UnitType.MAIN_BUILDING
        const hasTerrain = !!tile.terrain
        return isAlly || hasTerrain
      })

      if (!allAlly) {
        return score
      }

      return score + 1
    },
    0
  )

  return scoredPoints
}
