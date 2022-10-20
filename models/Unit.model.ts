import mongoose from "mongoose"
export interface IUnit {
  playerId: string
}

const unitSchema = new mongoose.Schema({
  playerId: String,
})

export default mongoose.models["Unit"] || mongoose.model("Unit", unitSchema)
