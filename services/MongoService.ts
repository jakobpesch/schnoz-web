// connection.js
import mongoose from "mongoose"

const connection =
  process.env.MONGODB_URI || "mongodb://localhost:27017/mongo-schnoz"
console.log(process.env.MONGODB_URI)

const connectDb = () => {
  return mongoose.connect(connection)
}

export default connectDb
