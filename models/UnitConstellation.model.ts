export type Coordinate2D = [row: number, col: number]
export interface IUnitConstellation {
  coordinates: Coordinate2D[]
  // mirroredY: boolean
  // mirroredX: boolean
  rotatedClockwise: 0 | 1 | 2 | 3
}
