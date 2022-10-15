import { Unit } from "./unit"

export interface Tile {
  id: string
  row: number
  col: number
  unit?: Unit
}
