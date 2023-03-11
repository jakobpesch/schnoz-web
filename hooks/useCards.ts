import Mousetrap from "mousetrap"
import { useEffect, useMemo, useState } from "react"
import { MatchRich } from "../types/Match"
import {
  Card,
  decodeUnitConstellation,
} from "../utils/constallationTransformer"

export function useCards(match: MatchRich | undefined, yourTurn: boolean) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const cards =
    useMemo(() => {
      return match?.openCards?.map(decodeUnitConstellation)
    }, [match?.updatedAt]) ?? []

  useEffect(() => {
    match?.openCards.forEach((unitConstellation, index) => {
      const hotkey = index + 1 + ""
      Mousetrap.unbind(hotkey)
      if (yourTurn) {
        Mousetrap.bind(hotkey, () =>
          setSelectedCard(decodeUnitConstellation(unitConstellation))
        )
      }
    })
    Mousetrap.unbind("esc")
    if (yourTurn) {
      Mousetrap.bind("esc", () => setSelectedCard(null))
    }
  }, [match?.updatedAt])

  return { cards, selectedCard, setSelectedCard }
}
