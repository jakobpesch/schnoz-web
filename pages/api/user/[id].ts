// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"

import { prisma } from "../../../prisma/client"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, method } = req
  const userId = query.id

  if (typeof userId !== "string") {
    res.status(400).end(`Invalid user id provided: ${userId}.`)
    return
  }

  switch (method) {
    case "DELETE":
      const deletedUser = await prisma.match.delete({ where: { id: userId } })

      if (!deletedUser) {
        res.status(500).end("User could not be deleted")
        break
      }
      res.status(200).json(deletedUser)
      break
    case "GET":
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        res.status(404).end(`User with id ${userId} not found.`)
        break
      }

      res.status(200).json(user)
      break
    default:
      res.setHeader("Allow", ["DELETE", "GET"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
