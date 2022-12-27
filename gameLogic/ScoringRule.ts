import { Terrain, UnitType } from "@prisma/client"
import { Coordinate2D } from "../models/UnitConstellation.model"
import {
  buildTileLookupId,
  getAdjacentCoordinates,
  TileLookup,
} from "../utils/coordinateUtils"

export type ScoringRule = (playerId: string, tileLookup: TileLookup) => number

const buildTerrainRule: (options: {
  terrain: Terrain
  penalty?: boolean
}) => ScoringRule =
  (options: { terrain: Terrain; penalty?: boolean }) =>
  (playerId, tileLookup) => {
    const { terrain, penalty } = options
    const point = penalty ? -1 : 1
    const terrainTiles = Object.values(tileLookup).filter(
      (tile) => tile.terrain === terrain && tile.visible
    )
    const scoredPoints = terrainTiles.reduce((score, waterTile) => {
      const terrainCoordinate: Coordinate2D = [waterTile.row, waterTile.col]
      const adjacentCoordinates = getAdjacentCoordinates(terrainCoordinate)
      const hasUnitNearTerrainTile = adjacentCoordinates.some(
        (coordinate) =>
          tileLookup[buildTileLookupId(coordinate)]?.unit?.ownerId === playerId
      )
      if (hasUnitNearTerrainTile) {
        return score + point
      }
      return score
    }, 0)

    return scoredPoints
  }

export const waterRule: ScoringRule = buildTerrainRule({
  terrain: Terrain.WATER,
})

export const stoneRule: ScoringRule = buildTerrainRule({
  terrain: Terrain.STONE,
  penalty: true,
})

export const holeRule: ScoringRule = (playerId, tileLookup) => {
  const potentialHolesTiles = Object.values(tileLookup).filter(
    (tile) => tile.visible && !tile.unit && !tile.terrain
  )

  const scoredPoints = potentialHolesTiles.reduce(
    (score, potentialHoleTile) => {
      const potentialHoleCoordinate: Coordinate2D = [
        potentialHoleTile.row,
        potentialHoleTile.col,
      ]

      const adjacentTilesToPotentialHole = getAdjacentCoordinates(
        potentialHoleCoordinate
      )

      const adjacentTiles = adjacentTilesToPotentialHole
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
  console.log(scoredPoints, "hole")

  return scoredPoints
}

export const diagnoalRule: ScoringRule = (playerId, tileLookup) => {
  return 0
  // const tiles = Object.values(tileLookup)
  // const unitTiles = tiles.filter((tile) => tile.unit?.ownerId === playerId)
  // const mapSize = Math.sqrt(tiles.length)
  // const score = 0
  // const processedTileIds = new Set<string>()
  // unitTiles.forEach((unitTile) => {
  //   if (processedTileIds.has(unitTile.id)) {
  //     return
  //   }
  //   processedTileIds.add(unitTile.id)

  //   const checkTile = (
  //     tile: TileRich,
  //     predicate: (tile: TileRich) => boolean
  //   ) => {
  //     return predicate(tile)
  //   }

  //   const checkDiagonalToTopRight = tileLookup

  //   while (true) {
  //     let diagonalLength = 1
  //     const [bottomLeft, topRight] = getTopRightDiagonallyAdjacentCoordinates([
  //       unitTile.row,
  //       unitTile.col,
  //     ])
  //     const bottomLeftTile = tileLookup[buildTileLookupId(bottomLeft)]
  //     const topRightTile = tileLookup[buildTileLookupId(topRight)]
  //     if (!bottomLeftTile.unit && !topRightTile.unit) {
  //     }
  //     if (bottomLeftTile?.unit) {
  //       diagonalLength++
  //       processedTileIds.add(bottomLeftTile.id)
  //     }
  //     if (topRightTile?.unit) {
  //       diagonalLength++
  //       processedTileIds.add(topRightTile.id)
  //     }
  //   }
  // })
  // // for (let row = 0; row < mapSize; row++) {
  // //   const diagonals: Coordinate2D[] = []
  // //   for (let col = 0; col < mapSize; col++) {
  // //     const tile = tileLookup[buildTileLookupId([row, col])]

  // //     if (!tile) {
  // //       continue
  // //     }
  // //   }
  // // }
  // return score
}
