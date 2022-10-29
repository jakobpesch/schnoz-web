import { Coordinate2D } from "../models/UnitConstellation.model"

type TransformationFunction = (coordinates: Coordinate2D[]) => Coordinate2D[]

export const normaliseCoordinates: TransformationFunction = (coordinates) => {
  const [minRow, minCol] = separateCoordinates(coordinates).map((values) => {
    return Math.min(...values)
  })

  return coordinates.map((coordinate) =>
    addCoordinates(
      [minRow < 0 ? Math.abs(minRow) : 0, minCol < 0 ? Math.abs(minCol) : 0],
      coordinate
    )
  )
}

/** Rotates and/or mirrors the coordinates. Negative coordinates likely.
 * Example clockwise rotation: `[[0,0],[1,1],[1,2]] => [[0,-0],[1,-1],[2,-0]]` */
export const transformCoordinates = (
  coordinates: Coordinate2D[],
  transformation: {
    rotatedClockwise?: number
  }
) => {
  let transformedCoordinates: Coordinate2D[] = coordinates
  if (transformation.rotatedClockwise) {
    for (let i = 0; i < transformation.rotatedClockwise; i++) {
      transformedCoordinates = rotateClockwise(transformedCoordinates)
    }
  }
  return transformedCoordinates
}

export const addCoordinates = (x: Coordinate2D, y: Coordinate2D) =>
  [x[0] + y[0], x[1] + y[1]] as Coordinate2D

/** Translates the coordinates to the target tile. The constellation needs to be normalised (first coordinate equals [0,0]) to be positioned at the target as expected. */
export const positionCoordinatesAt = (
  target: Coordinate2D,
  constellation: Coordinate2D[]
) => constellation.map((coordinate) => addCoordinates(coordinate, target))

export const rotateClockwise: TransformationFunction = (
  coordinates: Coordinate2D[]
) => coordinates.map(([row, col]) => [col, -row])

export const rotateCounterClockwise: TransformationFunction = (
  coordinates: Coordinate2D[]
) => coordinates.map(([row, col]) => [-col, row])

export const mirrorAlongYAxis: TransformationFunction = (
  coordinates: Coordinate2D[]
) => coordinates.map(([row, col]) => [-row, col])

export const mirrorAlongXAxis: TransformationFunction = (
  coordinates: Coordinate2D[]
) => coordinates.map(([row, col]) => [row, -col])

export type SepratedCoordinates = [Coordinate2D["0"][], Coordinate2D["1"][]]

export const separateCoordinates = (coordinates: Coordinate2D[]) => {
  return coordinates.reduce(
    (acc, cur) => {
      acc[0].push(cur[0])
      acc[1].push(cur[1])
      return acc
    },
    [[], []] as SepratedCoordinates
  )
}
export const generateSquareMatrix = (coordinates: Coordinate2D[]) => {
  const [rowValues, columnValues] = separateCoordinates(coordinates)

  const minRow = Math.min(...rowValues)
  const minColumn = Math.min(...columnValues)

  const correctedCoordinates = coordinates.map((coordinate) => [
    minRow < 0 ? coordinate[0] + Math.abs(minRow) : coordinate[0],
    minColumn < 0 ? coordinate[1] + Math.abs(minColumn) : coordinate[1],
  ])

  const size =
    Math.max(
      ...correctedCoordinates.map((coordinate) =>
        Math.max(...coordinate.map(Math.abs))
      )
    ) + 1

  const zeroArray: 0[] = new Array(size).fill(0)
  const squareZeroMatrix = zeroArray.map((_) => zeroArray)

  const squareMatrix: number[][] = squareZeroMatrix.map((row, rowIndex) => {
    const rowWithValues = row.map((zero, colIndex) => {
      if (
        correctedCoordinates.some(
          (coordinate) =>
            coordinate[0] === rowIndex && coordinate[1] === colIndex
        )
      ) {
        return 1
      }
      return zero
    })

    return rowWithValues
  })
  return squareMatrix
}

export const printCoordinate2DasSquareMatrix = (
  squareMatrix: ReturnType<typeof generateSquareMatrix>
) => {
  let str = ""
  squareMatrix.forEach((row) => {
    row.forEach((value) => {
      str += value + " "
    })
    str += "\n"
  })
  console.log(str)
}
