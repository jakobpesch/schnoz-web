import { ITile } from "./tile"

export interface IMap {
  rowCount: number
  columnCount: number
  tiles: ITile[]
}
