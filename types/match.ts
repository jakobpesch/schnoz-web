import { IMap } from "./map"
import { IMove } from "./move"

export interface IMatch {
  _id: string
  createdBy: string
  activePlayer: string
  players: string[]
  status: string
  map: IMap
  moves: IMove[]
}
