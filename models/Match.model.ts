import mongoose from "mongoose"
import { mapSchema, IMap } from "./Map.model"
import { IMove } from "./Move.model"
export interface IMatch {
  _id: string
  createdBy: string
  activePlayer: string
  players: string[]
  status: string
  map: IMap
  moves: IMove[]
}

const matchSchema = new mongoose.Schema({
  createdBy: String,
  status: String,
  players: {
    type: Array,
    items: String,
  },
  map: mapSchema,
  activePlayer: String,
  turn: Number,
  maxTurns: Number,
})

export default mongoose.models["Match"] || mongoose.model("Match", matchSchema)
