import { UnitType } from "@prisma/client"
import { Coordinate2D } from "../models/UnitConstellation.model"
import { MatchRich } from "../types/Match"
import { TileWithUnits } from "../types/Tile"
import {
  coordinatesAreEqual,
  getAdjacentCoordinatesOfConstellation,
} from "../utils/coordinateUtils"

export const inBounds: PlacementRule = (constellation, map) =>
  constellation.every(
    ([row, col]) =>
      row >= 0 && col >= 0 && row < map.rowCount && col < map.colCount
  )

export type PlacementRule = (
  constellation: Coordinate2D[],
  // @todo consider replaceing with tile lookup
  map: Exclude<MatchRich["map"], null>,
  playerId: string
) => boolean

export const noUnit: PlacementRule = (constellation, map) => {
  const hasUnit = constellation.some(
    ([row, col]) =>
      !!map.tiles.find((tile) => tile.row === row && tile.col === col)?.unit
  )
  return !hasUnit
}

export const noTerrain: PlacementRule = (constellation, map) => {
  const hasTerrain = constellation.some(
    ([row, col]) =>
      !!map.tiles.find((tile) => tile.row === row && tile.col === col)?.terrain
  )
  return !hasTerrain
}

export const adjacentToAlly: PlacementRule = (constellation, map, playerId) => {
  const adjacentCoordinates =
    getAdjacentCoordinatesOfConstellation(constellation)

  const adjacentTiles = adjacentCoordinates
    .map((coordinate) =>
      map.tiles.find((tile) =>
        coordinatesAreEqual([tile.row, tile.col], coordinate)
      )
    )
    .filter((tile): tile is TileWithUnits => !!tile)

  const isAdjacentToAlly = adjacentTiles.some(
    (tile) =>
      tile.unit?.ownerId === playerId ||
      tile.unit?.type === UnitType.MAIN_BUILDING
  )
  return isAdjacentToAlly
}

export type PlacementRuleName =
  | "NO_UNIT"
  | "ADJACENT_TO_ALLY"
  | "NO_TERRAIN"
  | "IN_BOUNDS"

export const placementRulesMap = new Map<PlacementRuleName, PlacementRule>([
  ["NO_UNIT", noUnit],
  ["ADJACENT_TO_ALLY", adjacentToAlly],
  ["NO_TERRAIN", noTerrain],
  ["IN_BOUNDS", inBounds],
])

export type PlacementRuleMap = typeof placementRulesMap
