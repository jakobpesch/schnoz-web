// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"

import { prisma } from "../../../prisma/client"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req
  console.log(method, body)

  const email = body.email

  if (typeof email !== "string") {
    res.status(400).end(`Invalid email provided: ${email}.`)
    return
  }

  switch (method) {
    case "POST":
      const user = await prisma.user.findUnique({
        where: { email: email },
      })

      console.log(user)

      if (!user) {
        res.status(404).end("FAIL")
        break
      }

      res.status(200).json(user)
      break
    default:
      res.setHeader("Allow", ["POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
