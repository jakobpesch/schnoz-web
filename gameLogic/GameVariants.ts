import { Match, Participant } from "@prisma/client"
import assert from "assert"
import { MatchRich, MatchWithPlayers } from "../types/Match"
import { getTileLookup } from "../utils/coordinateUtils"
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

type EvaluationCondition = (turn: Match["turn"]) => boolean
type Evaluation = (match: MatchRich) => Participant[]

export interface GameType {
  shouldChangeActivePlayer: (turn: Match["turn"]) => boolean
  shouldEvaluate: EvaluationCondition
  evaluate: Evaluation
  scoringRules: ScoringRule[]
  placementRules: PlacementRule[]
}

export const defaultGame: GameType = {
  shouldChangeActivePlayer: (turn: Match["turn"]) => {
    return turn % 2 !== 0
  },
  evaluate: function (match) {
    if (!this.shouldEvaluate(match.turn)) {
      return match.players
    }
    assert(match.map)
    const tileLookup = getTileLookup(match.map.tiles)

    const winners = this.scoringRules.map((rule) => {
      const evaluations = match.players.map((player) => {
        return rule(player.id, tileLookup)
      })
      if (
        evaluations.every(
          (evaluation) => evaluation.points - evaluations[0].points === 0
        )
      ) {
        return null
      }
      const winningEvaluation = evaluations
        .sort((a, b) => {
          if (a.points > b.points) {
            return -1
          } else {
            return 1
          }
        })
        .shift()
      assert(winningEvaluation)
      return winningEvaluation
    })

    const playersWithUpdatedScores = match.players.map<Participant>(
      (player) => {
        const wonRulesCount = winners.filter(
          (evaluation) => evaluation?.playerId === player.id
        ).length
        return { ...player, score: player.score + wonRulesCount }
      }
    )

    return playersWithUpdatedScores
  },
  shouldEvaluate: (turn) => {
    return turn % 6 === 0
  },
  scoringRules: [waterRule, stoneRule, holeRule, diagnoalRule],
  placementRules: [inBounds, noUnit, noTerrain, adjacentToAlly],
}
