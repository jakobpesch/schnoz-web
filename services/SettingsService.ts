import { Participant, Rule, Terrain } from "@prisma/client"

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
  getTerrainAppearance: (terrain: Terrain) => {
    if (terrain === Terrain.WATER) {
      return "🧿"
    }
    if (terrain === Terrain.TREE) {
      return "🌳"
    }
    if (terrain === Terrain.STONE) {
      return "🗿"
    }
  },
  getRuleName: (rule: Rule) => {
    if (rule === "TERRAIN_WATER_POSITIVE") {
      return "Water D. Law"
    }
    if (rule === "TERRAIN_STONE_NEGATIVE") {
      return "Stoned"
    }
    if (rule === "HOLE") {
      return "Glorious Holes"
    }
    if (rule === "DIAGONAL_NORTHEAST") {
      return "Diagon-Alley NE"
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
