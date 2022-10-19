import mongoose from "mongoose"

export const tileSchema = new mongoose.Schema({
  id: String,
  row: Number,
  col: Number,
})

export default mongoose.models["Tile"] || mongoose.model("Tile", tileSchema)
