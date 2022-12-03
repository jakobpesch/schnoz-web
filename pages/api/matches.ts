// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import connectDb from "../../services/MongoService"
import Match from "../../models/Match.model"
import mongoose from "mongoose"

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

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
            },
          },
        },
        include: {
          players: true,
          map: { include: { tiles: true } },
        },
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
        include: {
          players: true,
          map: { include: { tiles: true } },
        },
      })
      res.status(200).json(matches)
      break
    default:
      res.setHeader("Allow", ["POST", "GET"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
