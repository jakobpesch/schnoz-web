// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
type Data = {
  name: string
}
const initialiseMap = (rowCount: number, columnCount: number) => {
  const rowIndices = [...Array(rowCount).keys()]
  const columnIndices = [...Array(columnCount).keys()]
  const map = {} as any
  rowIndices.forEach((iRow) => {
    columnIndices.forEach((iCol) => {
      const id = `${iRow}_${iCol}`
      map[id] = { id: id, row: iRow, col: iCol, unit: null }
    })
  })
  return map
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { body, method } = req
  switch (method) {
    // case "POST":
    //   await connectDb()
    //   const map = new Map(initialiseMap(body.rowCount, body.columnCount))
    //   await map.save()
    //   break
    case "GET":
      break
    default:
      res.setHeader("Allow", ["POST", "GET"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
