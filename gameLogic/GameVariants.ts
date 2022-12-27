import {
  inBounds,
  noUnit,
  adjacentToAlly,
  noTerrain,
  PlacementRule,
} from "./PlacementRule"
import { holeRule, ScoringRule, stoneRule, waterRule } from "./ScoringRule"

export interface GameType {
  scoringRules: ScoringRule[]
  placementRules: PlacementRule[]
}

export const defaultGame: GameType = {
  scoringRules: [waterRule, stoneRule, holeRule],
  placementRules: [inBounds, noUnit, noTerrain, adjacentToAlly],
}
