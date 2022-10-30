import { inBounds, noUnit, adjacentToAlly } from "./PlacementRule"

export const defaultGame = {
  placementRules: [inBounds, noUnit, adjacentToAlly],
}
