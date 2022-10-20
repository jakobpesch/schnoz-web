import { ITile } from "./tile"

export interface IMove {
  tileId: ITile["id"]
  userId: string
}
