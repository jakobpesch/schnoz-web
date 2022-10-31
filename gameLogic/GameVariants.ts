import { inBounds, noUnit, adjacentToAlly, noTerrain } from "./PlacementRule"
import { waterRule } from "./ScoringRule"

export const defaultGame = {
  scoringRules: [waterRule],
  placementRules: [inBounds, noUnit, noTerrain, adjacentToAlly],
}
