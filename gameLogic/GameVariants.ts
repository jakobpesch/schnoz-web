import { inBounds, noUnit, adjacentToAlly } from "./PlacementRule"
import { waterRule } from "./ScoringRule"

export const defaultGame = {
  scoringRules: [waterRule],
  placementRules: [inBounds, noUnit, adjacentToAlly],
}
