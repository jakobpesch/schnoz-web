import { Match, Participant } from "@prisma/client"
import { MatchWithPlayers } from "../types/Match"
import {
  inBounds,
  noUnit,
  adjacentToAlly,
  noTerrain,
  PlacementRule,
} from "./PlacementRule"
import {
  diagnoalRule,
  holeRule,
  ScoringRule,
  stoneRule,
  waterRule,
} from "./ScoringRule"

type EvaluationCondition = (match: Match) => boolean

export interface GameType {
  determineNextPlayer: (match: MatchWithPlayers) => Participant["playerNumber"]
  shouldEvaluate: EvaluationCondition
  scoringRules: ScoringRule[]
  placementRules: PlacementRule[]
}

export const defaultGame: GameType = {
  determineNextPlayer: (match) => {
    return match.turn % 2 !== 0 ? 0 : 1
  },
  shouldEvaluate: (match) => {
    return match.turn % 3 === 0
  },
  scoringRules: [waterRule, stoneRule, holeRule, diagnoalRule],
  placementRules: [inBounds, noUnit, noTerrain, adjacentToAlly],
}
