import mongoose from "mongoose"

import { mapSchema } from "./Map.model"

const matchSchema = new mongoose.Schema({
  creator: String,
  status: String,
  players: {
    type: Array,
    items: String,
  },
  map: mapSchema,
  activePlayer: String,
})

export default mongoose.models["Match"] || mongoose.model("Match", matchSchema)
