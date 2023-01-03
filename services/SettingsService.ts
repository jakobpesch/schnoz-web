import { Participant, Rule } from "@prisma/client"

export const RenderSettings = {
  tileSize: 50,
  getPlayerAppearance: (playerNumber?: Participant["playerNumber"]) => {
    let unit = ""
    let color = ""
    if (playerNumber === 0) {
      unit = "🦁"
      color = "orange.900"
    } else if (playerNumber === 1) {
      unit = "🐵"
      color = "teal.800"
    } else {
      unit = "🛖"
      color = "gray.700"
    }
    return { unit, color }
  },
  getRuleAppearance: (rule: Rule) => {
    if (rule === "TERRAIN_WATER_POSITIVE") {
      return "🧿"
    }
    if (rule === "HOLE") {
      return "🕳"
    }
    if (rule === "TERRAIN_STONE_NEGATIVE") {
      return "🗿"
    }
    if (rule === "DIAGONAL_NORTHEAST") {
      return "↗"
    }
  },
}

export interface MatchSettings {
  mapSize: 11 | 21 | 31
}

export const GameSettings = {
  rowCount: 8,
  columnCount: 8,
}
