import mongoose from "mongoose"
import { tileSchema } from "./Tile.model"

export const mapSchema = new mongoose.Schema({
  rowCount: Number,
  columnCount: Number,
  tiles: {
    type: Array,
    items: tileSchema,
  },
})

export default mongoose.models["Map"] || mongoose.model("Map", mapSchema)
