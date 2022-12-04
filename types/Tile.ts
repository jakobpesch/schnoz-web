import { Prisma } from "@prisma/client"

const tileRich = Prisma.validator<Prisma.TileArgs>()({
  include: {
    unit: true,
  },
})

export type TileRich = Prisma.TileGetPayload<typeof tileRich>
