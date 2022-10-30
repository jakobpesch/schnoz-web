import { Terrain } from "../models/Terrain.model"
import { Coordinate2D } from "../models/UnitConstellation.model"
import {
  buildTileId,
  getAdjacentCoordinatesOfConstellation,
  TileLookup,
} from "../utils/coordinateUtils"

type ScoringRule = (
  coordinates: Coordinate2D[],
  tileLookup: TileLookup
) => number

export const waterRule: ScoringRule = (coordinates, tileLookup) => {
  const adjacentCoordinates = getAdjacentCoordinatesOfConstellation(coordinates)
  const adjacentWaterTiles = adjacentCoordinates.filter((coordinate) => {
    return (
      tileLookup[buildTileId(coordinate)]?.terrain === Terrain.water ?? false
    )
  })
  const scoredPoints = adjacentWaterTiles.length
  return scoredPoints
}
