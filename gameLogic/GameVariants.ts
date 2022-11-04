import { inBounds, noUnit, adjacentToAlly, noTerrain } from "./PlacementRule"
import { holeRule, stoneRule, waterRule } from "./ScoringRule"

export const defaultGame = {
  scoringRules: [waterRule, stoneRule, holeRule],
  placementRules: [inBounds, noUnit, noTerrain, adjacentToAlly],
}
