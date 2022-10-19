// connection.js
import mongoose from "mongoose"

const connection = "mongodb://localhost:27017/mongo-schnoz"

const connectDb = () => {
  return mongoose.connect(connection)
}

export default connectDb
