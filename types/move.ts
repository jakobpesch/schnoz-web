import { Tile } from "./tile"

export interface Move {
  tileId: Tile["id"]
  userId: string
}
