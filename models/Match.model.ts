import mongoose, { Document } from "mongoose"
import { mapSchema, IMap } from "./Map.model"
import { IMove } from "./Move.model"

export type MatchStatus = "created" | "started" | "finished"
export interface IMatch {
  createdBy: string
  activePlayer: string
  players: string[]
  status: MatchStatus
  map: IMap
  moves: IMove[]
  turn: number
  maxTurns: number
}

export interface IMatchDoc extends IMatch, Document {}

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
