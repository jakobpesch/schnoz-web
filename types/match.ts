import { Map } from "./map"
import { Move } from "./move"

export interface Match {
  _id: string
  creator: string
  activePlayer: string
  players: string[]
  status: string
  map: Map
  moves: Move[]
}
