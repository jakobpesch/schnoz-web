// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import connectDb from "../../services/MongoService"
import Match from "../../models/Match.model"
import mongoose from "mongoose"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req
  switch (method) {
    case "POST":
      // sign in anonymously
      res.status(201).json(new mongoose.Types.ObjectId())
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
