import { Terrain, UnitType } from "@prisma/client"
import { Coordinate2D } from "../models/UnitConstellation.model"
import { addCoordinates } from "../utils/constallationTransformer"
import {
  buildTileLookupId,
  getAdjacentCoordinates,
  TileLookup,
} from "../utils/coordinateUtils"

export interface RuleEvaluation {
  type: RuleType
  points: number
  /** fulfillments[0] = One fulfillment of the rule gives one point. fulfillment[0][0] is the coordinate, that (in part or completely) fulfills the rule */
  fulfillments: Coordinate2D[][]
}

export type ScoringRule = (
  playerId: string,
  tileLookup: TileLookup
) => RuleEvaluation

export type RuleType = "hole" | "water" | "stone" | "diagonal"

const buildTerrainRule: (options: {
  terrain: Terrain
  penalty?: boolean
  ruleType: RuleType
}) => ScoringRule =
  (options: { terrain: Terrain; penalty?: boolean; ruleType: RuleType }) =>
  (playerId, tileLookup) => {
    const { terrain, penalty, ruleType } = options

    const ruleEvaluation: RuleEvaluation = {
      type: ruleType,
      points: 0,
      fulfillments: [],
    }

    const point = penalty ? -1 : 1

    const terrainTiles = Object.values(tileLookup).filter(
      (tile) => tile.terrain === terrain && tile.visible
    )

    terrainTiles.forEach((terrainTile) => {
      const terrainCoordinate: Coordinate2D = [terrainTile.row, terrainTile.col]
      const adjacentCoordinates = getAdjacentCoordinates(terrainCoordinate)
      const hasUnitAdjacentToTerrainTile = adjacentCoordinates.some(
        (coordinate) =>
          tileLookup[buildTileLookupId(coordinate)]?.unit?.ownerId === playerId
      )
      if (hasUnitAdjacentToTerrainTile) {
        ruleEvaluation.fulfillments.push([terrainCoordinate])
        ruleEvaluation.points += point
      }
    }, 0)

    return ruleEvaluation
  }

export const waterRule: ScoringRule = buildTerrainRule({
  terrain: Terrain.WATER,
  ruleType: "water",
})

export const stoneRule: ScoringRule = buildTerrainRule({
  terrain: Terrain.STONE,
  penalty: true,
  ruleType: "stone",
})

export const holeRule: ScoringRule = (playerId, tileLookup) => {
  const ruleEvaluation: RuleEvaluation = {
    type: "hole",
    points: 0,
    fulfillments: [],
  }
  const potentialHolesTiles = Object.values(tileLookup).filter(
    (tile) => tile.visible && !tile.unit && !tile.terrain
  )

  potentialHolesTiles.forEach((potentialHoleTile) => {
    const potentialHoleCoordinate: Coordinate2D = [
      potentialHoleTile.row,
      potentialHoleTile.col,
    ]

    const adjacentCoordinatesToPotentialHole = getAdjacentCoordinates(
      potentialHoleCoordinate
    )

    const adjacentTiles = adjacentCoordinatesToPotentialHole
      .map((coordinate) => tileLookup[buildTileLookupId(coordinate)] ?? null)
      .filter((tile) => !!tile)

    const allAlly = adjacentTiles.every((tile) => {
      const isAlly =
        tile.unit?.ownerId === playerId ||
        tile.unit?.type === UnitType.MAIN_BUILDING
      const hasTerrain = !!tile.terrain
      return isAlly || hasTerrain
    })

    if (allAlly) {
      ruleEvaluation.fulfillments.push([potentialHoleCoordinate])
      ruleEvaluation.points += 1
    }
  }, 0)

  return ruleEvaluation
}

export const diagnoalRule: ScoringRule = (playerId, tileLookup) => {
  const ruleEvaluation: RuleEvaluation = {
    type: "diagonal",
    points: 0,
    fulfillments: [],
  }
  const tiles = Object.values(tileLookup)
  const unitTiles = tiles.filter((tile) => tile.unit?.ownerId === playerId)

  const processedTileIds = new Set<string>()
  unitTiles.forEach((unitTile) => {
    if (processedTileIds.has(unitTile.id)) {
      return
    }
    processedTileIds.add(unitTile.id)

    let startCoordinate: Coordinate2D = [unitTile.row, unitTile.col]
    let fulfillment: RuleEvaluation["fulfillments"][0] = [[...startCoordinate]]

    let currentCoordinate: Coordinate2D = [...startCoordinate]
    let safetyIndex = 0
    while (true) {
      safetyIndex++

      // go to top right
      const topRightCoordinate = addCoordinates(currentCoordinate, [-1, 1])
      const topRightTile = tileLookup[buildTileLookupId(topRightCoordinate)]

      if (!topRightTile) {
        break
      }

      const topRightUnitTile = unitTiles.find(
        (unitTile) => unitTile.id === topRightTile.id
      )
      const topRightIsPlayersUnit =
        !topRightUnitTile ||
        !topRightUnitTile.unit ||
        topRightUnitTile.unit.ownerId !== playerId

      if (topRightIsPlayersUnit) {
        break
      }

      processedTileIds.add(topRightUnitTile.id)
      fulfillment.push(topRightCoordinate)
      currentCoordinate = [...topRightCoordinate]

      if (safetyIndex > 20) {
        break
      }
    }

    currentCoordinate = [...startCoordinate]
    safetyIndex = 0
    while (true) {
      safetyIndex++

      // go to top right
      const bottomLeftCoordinate = addCoordinates(currentCoordinate, [1, -1])
      const bottomLeftTile = tileLookup[buildTileLookupId(bottomLeftCoordinate)]

      if (!bottomLeftTile) {
        break
      }

      const bottomLeftUnitTile = unitTiles.find(
        (unitTile) => unitTile.id === bottomLeftTile.id
      )
      const bottomLeftIsPlayersUnit =
        !bottomLeftUnitTile ||
        !bottomLeftUnitTile.unit ||
        bottomLeftUnitTile.unit.ownerId !== playerId

      if (bottomLeftIsPlayersUnit) {
        break
      }

      processedTileIds.add(bottomLeftUnitTile.id)
      fulfillment.push(bottomLeftCoordinate)
      currentCoordinate = [...bottomLeftCoordinate]

      if (safetyIndex > 20) {
        break
      }
    }
    if (fulfillment.length >= 3) {
      ruleEvaluation.fulfillments.push(fulfillment)
      ruleEvaluation.points += 1
    }
    // go to bottom left
  })
  console.log(ruleEvaluation)

  return ruleEvaluation
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
