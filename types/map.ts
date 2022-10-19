import { Tile } from "./tile"

export interface Map {
  rowCount: number
  columnCount: number
  tiles: Tile[]
}
