// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import connectDb from "../../services/MongoService"
import Match from "../../models/Match.model"
import mongoose from "mongoose"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body, method } = req
  switch (method) {
    case "POST":
      const userId = body.userId ?? new mongoose.Types.ObjectId()
      await connectDb()
      const match = new Match({ createdBy: userId, players: [userId] })
      await match.save()
      res.status(201).json(match)
      break
    case "GET":
      await connectDb()
      const matches = await Match.find({})
      res.status(200).json(matches)
      break
    default:
      res.setHeader("Allow", ["POST", "GET"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
