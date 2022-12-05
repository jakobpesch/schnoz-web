import { ITile } from "../models/Tile.model"
import { Coordinate2D } from "../models/UnitConstellation.model"
import { TileRich } from "../types/Tile"
import { addCoordinates } from "./constallationTransformer"

export const buildTileLookupId = (coordinate: Coordinate2D) => {
  return `${coordinate[0]}_${coordinate[1]}`
}

export const coordinateFromTileId = (tileId: ITile["id"]) => {
  return tileId.split("_").map((x) => parseInt(x)) as Coordinate2D
}

export interface TileLookup {
  [tileId: string]: TileRich
}

export const getTileLookup = (tiles: TileRich[]) => {
  return tiles.reduce<TileLookup>((acc, cur) => {
    return {
      ...acc,
      [buildTileLookupId([cur.row, cur.col])]: cur,
    }
  }, {})
}

export const getCoordinateCircle = (radius: number) => {
  const range = Array.from(
    { length: 2 * radius + 1 },
    (v, index) => index - radius
  )
  const squareMatrix: Coordinate2D[] = []
  range.forEach((row) => range.forEach((col) => squareMatrix.push([row, col])))
  return squareMatrix.filter(
    ([row, col]) => Math.sqrt(row ** 2 + col ** 2) <= radius + 0.5
  )
}

export const coordinateIncludedIn = (
  coordinates: Coordinate2D[],
  coordinate: Coordinate2D
) => coordinates.some((c) => coordinatesAreEqual(c, coordinate))

export const coordinatesAreEqual = (
  coordianteA: Coordinate2D,
  coordianteB: Coordinate2D
) => coordianteA[0] === coordianteB[0] && coordianteA[1] === coordianteB[1]

export const coordinatesAreAdjacent = (
  coordinateA: Coordinate2D,
  coordinateB: Coordinate2D
) => {
  const [rowA, colA] = coordinateA
  const [rowB, colB] = coordinateB
  return Math.abs(rowA - rowB) === 1 || Math.abs(colA - colB) === 1
}

export const getAdjacentCoordinates = (coordinate: Coordinate2D) => {
  const adjacentCoordinates = [
    addCoordinates(coordinate, [1, 0]),
    addCoordinates(coordinate, [0, 1]),
    addCoordinates(coordinate, [-1, 0]),
    addCoordinates(coordinate, [0, -1]),
  ]
  return adjacentCoordinates
}

export const getAdjacentCoordinatesOfConstellation = (
  constellation: Coordinate2D[]
) => {
  const adjacent = constellation.reduce((acc, cur) => {
    const adjacent = getAdjacentCoordinates(cur)
    const removedDuplicates = adjacent.filter((coordinate) => {
      const inAcc = coordinateIncludedIn(acc, coordinate)
      const inConstellation = coordinateIncludedIn(constellation, coordinate)
      return !inAcc && !inConstellation
    })
    return [...acc, ...removedDuplicates]
  }, [] as Coordinate2D[])

  return adjacent
}
