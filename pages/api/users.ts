// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "../../prisma/client"
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body, method } = req
  switch (method) {
    case "POST":
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
        },
      })
      res.status(201).json(user)
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
