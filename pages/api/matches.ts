// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import connectDb from "../../services/MongoService"
import Match from "../../models/Match.model"
import mongoose from "mongoose"
import { matchRichInclude } from "../../types/Match"
import { prisma } from "../../prisma/client"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body, method } = req
  switch (method) {
    case "POST":
      const match = await prisma.match.create({
        data: {
          createdById: body.userId,
          maxPlayers: 2,
          players: {
            create: {
              userId: body.userId,
              playerNumber: 0,
            },
          },
        },
        include: matchRichInclude,
      })
      console.log(match)

      // await connectDb()
      // const match = new Match({
      //   createdBy: userId,
      //   players: [userId],
      //   status: "created",
      // })
      // await match.save()
      res.status(201).json(match)
      break
    case "GET":
      const matches = await prisma.match.findMany({
        include: matchRichInclude,
      })
      res.status(200).json(matches)
      break
    default:
      res.setHeader("Allow", ["POST", "GET"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
