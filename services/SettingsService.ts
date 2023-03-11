import { GameSettings, Participant, Rule, Terrain } from "@prisma/client"
import { StaticImageData } from "next/image"
import bob from "../assets/sprites/bob.png"
import background from "../assets/sprites/grass.png"
import house from "../assets/sprites/house.png"
import maurice from "../assets/sprites/maurice.png"
import ruleDiagonal from "../assets/sprites/rule_diagonal_north_east.png"
import ruleHole from "../assets/sprites/rule_hole.png"
import ruleStone from "../assets/sprites/rule_stone.png"
import ruleWater from "../assets/sprites/rule_water.png"
import terrainStone from "../assets/sprites/terrain_stone.png"
import terrainTree from "../assets/sprites/terrain_tree.png"
import terrainWater from "../assets/sprites/terrain_water.png"
import { ClientEvent } from "../shared-server/client-event.enum"
import { socketApi, UpdateGameSettingsPayload } from "./SocketService"

export const RenderSettings = {
  tileSize: 50,
  getPlayerAppearance: (playerNumber?: Participant["playerNumber"]) => {
    let unit: StaticImageData = bob
    let color: string
    if (playerNumber === 0) {
      unit = bob
      color = "pink.900"
    } else if (playerNumber === 1) {
      unit = maurice
      color = "teal.800"
    } else {
      unit = house
      color = "gray.700"
    }
    return { unit, color }
  },
  background: background,
  getRuleAppearance: (rule: Rule) => {
    let sprite = ruleWater
    if (rule === "HOLE") {
      sprite = ruleHole
    }
    if (rule === "TERRAIN_STONE_NEGATIVE") {
      sprite = ruleStone
    }
    if (rule === "DIAGONAL_NORTHEAST") {
      sprite = ruleDiagonal
    }
    return sprite
  },
  getTerrainAppearance: (terrain: Terrain) => {
    let sprite = terrainWater
    if (terrain === Terrain.TREE) {
      sprite = terrainTree
    }
    if (terrain === Terrain.STONE) {
      sprite = terrainStone
    }
    return sprite
  },
  getRuleName: (rule: Rule) => {
    let name = "Water D. Law"
    if (rule === "TERRAIN_STONE_NEGATIVE") {
      name = "Stoned"
    }
    if (rule === "HOLE") {
      name = "Glorious Holes"
    }
    if (rule === "DIAGONAL_NORTHEAST") {
      name = "Diagon-Alley"
    }
    return name
  },
}

/** Update game settings for the current match
 * @param settings - The settings to update
 */
export async function updateGameSettings(
  settings: Omit<UpdateGameSettingsPayload, "matchId">
) {
  const gameSettings: UpdateGameSettingsPayload = {}
  if (settings.mapSize) {
    gameSettings.mapSize = settings.mapSize
  }
  if (settings.rules) {
    gameSettings.rules = settings.rules
  }
  if (settings.maxTurns != null) {
    gameSettings.maxTurns = settings.maxTurns
  }
  if (settings.waterRatio != null) {
    gameSettings.waterRatio = settings.waterRatio
  }
  if (settings.treeRatio != null) {
    gameSettings.treeRatio = settings.treeRatio
  }
  if (settings.stoneRatio != null) {
    gameSettings.stoneRatio = settings.stoneRatio
  }

  await socketApi.sendRequest({
    event: ClientEvent.UPDATE_GAME_SETTINGS,
    data: gameSettings,
  })
}
