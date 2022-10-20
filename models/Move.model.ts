import mongoose from "mongoose"
import { tileSchema, ITile } from "./Tile.model"

export interface IMove {
  tileId: ITile["id"]
  userId: string
}

const moveSchema = new mongoose.Schema({
  tileId: tileSchema,
})

export default mongoose.models["Move"] || mongoose.model("Move", moveSchema)
