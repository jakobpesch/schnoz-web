import { Unit } from "./unit"

export interface ITile {
  id: string
  row: number
  col: number
  unit?: Unit
}
