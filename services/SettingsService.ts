import { Participant } from "@prisma/client"

export const RenderSettings = {
  tileSize: 50,
  getPlayerAppearance: (participant?: Participant) => {
    let unit = ""
    let background = ""
    if (participant?.playerNumber === 0) {
      unit = "🦁"
      background = "orange.900"
    } else if (participant?.playerNumber === 1) {
      unit = "🐵"
      background = "teal.900"
    } else {
      unit = "🛖"
      background = "gray.700"
    }
    return { unit, background }
  },
}

export interface MatchSettings {
  mapSize: 11 | 21 | 31
}

export const GameSettings = {
  rowCount: 8,
  columnCount: 8,
}
