export type Coordinate2D = [row: number, col: number]
export interface IUnitConstellation {
  coordinates: Coordinate2D[]
  // mirroredY: boolean
  mirrored: boolean
  rotatedClockwise: 0 | 1 | 2 | 3
}
