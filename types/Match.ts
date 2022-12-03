import { Prisma } from "@prisma/client"

const matchWithPlayers = Prisma.validator<Prisma.MatchArgs>()({
  include: { players: true },
})

export type MatchWithPlayers = Prisma.MatchGetPayload<typeof matchWithPlayers>

const matchRich = Prisma.validator<Prisma.MatchArgs>()({
  include: {
    players: true,
    map: { include: { tiles: { include: { unit: true } } } },
    activePlayer: true,
  },
})

export const matchRichInclude = {
  players: true,
  map: { include: { tiles: { include: { unit: true } } } },
  activePlayer: true,
}

export type MatchRich = Prisma.MatchGetPayload<typeof matchRich>
