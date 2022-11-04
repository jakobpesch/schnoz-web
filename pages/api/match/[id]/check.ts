// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import Match, { IMatchDoc } from "../../../../models/Match.model"
import connectDb from "../../../../services/MongoService"
type Data = { match: IMatchDoc } | { message: "No Update" }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { query, method } = req
  let match: IMatchDoc | null
  switch (method) {
    case "GET":
      await connectDb()
      match = await Match.findById(req.query.id).exec()

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
