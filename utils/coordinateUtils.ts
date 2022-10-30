import { Coordinate2D } from "../models/UnitConstellation.model"
import { addCoordinates } from "./constallationTransformer"

export const includes = (
  coordinates: Coordinate2D[],
  coordinate: Coordinate2D
) => coordinates.some((c) => isEqual(c, coordinate))

export const isEqual = (coordianteA: Coordinate2D, coordianteB: Coordinate2D) =>
  coordianteA[0] === coordianteB[0] && coordianteA[1] === coordianteB[1]

export const isAdjacent = (
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
      const inAcc = includes(acc, coordinate)
      const inConstellation = includes(constellation, coordinate)
      return !inAcc && !inConstellation
    })
    return [...acc, ...removedDuplicates]
  }, [] as Coordinate2D[])

  return adjacent
}