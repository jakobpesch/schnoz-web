// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "../../../../prisma/client"
import { MatchRich, matchRichInclude } from "../../../../types/Match"
type Data = { match: MatchRich } | { message: "No Update" }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { query, method } = req
  const matchId = req.query.id

  if (typeof matchId !== "string") {
    res.status(404).end(`Invalid match id provided: ${matchId}.`)
    return
  }

  switch (method) {
    case "GET":
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchRichInclude,
      })

      if (match === null) {
        res.status(500).end("Could not find match")
        break
      }

      const time = query.time

      if (typeof time !== "string") {
        res.status(500).end("Invalid query parameter 'time'")
        break
      }

      if (new Date(time) < new Date(match.updatedAt)) {
        res.status(200).json({ match })
        break
      }

      res.status(304).end("No Update")
      break
    default:
      res.setHeader("Allow", ["GET"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
