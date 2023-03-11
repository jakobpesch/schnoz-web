import { UnitType } from "@prisma/client"
import assert from "assert"
import { useMemo } from "react"
import { Coordinate2D } from "../models/UnitConstellation.model"
import { Special } from "../services/GameManagerService"
import { MatchRich } from "../types/Match"
import { Card } from "../utils/constallationTransformer"
import {
  coordinatesAreEqual,
  getAdjacentCoordinatesOfConstellation,
  buildTileLookupId,
} from "../utils/coordinateUtils"
import { useTiles } from "./useTiles"

export function usePlaceableCoordinates(
  match: MatchRich | undefined,
  yourTurn: boolean,
  selectedCard: Card | null,
  activatedSpecials: Special[]
) {
  const { tileLookup } = useTiles(match)
  const placeableCoordinates =
    useMemo(() => {
      if (!yourTurn || !match || !match.map) {
        return []
      }

      if (
        selectedCard?.coordinates.length === 1 &&
        coordinatesAreEqual(selectedCard.coordinates[0], [0, 0])
      ) {
        const visibleAndFreeTiles: Coordinate2D[] = Object.values(tileLookup)
          .filter((tile) => tile.visible && !tile.unit && !tile.terrain)
          .map((tile) => [tile.row, tile.col])
        return visibleAndFreeTiles
      }

      const alliedTiles =
        match.map.tiles.filter(
          (tile) =>
            tile.unit?.ownerId === match.activePlayer?.id ||
            tile?.unit?.type === UnitType.MAIN_BUILDING
        ) ?? []

      let placeableCoordiantes = getAdjacentCoordinatesOfConstellation(
        alliedTiles.map((tile) => [tile.row, tile.col])
      ).filter((coordinate) => {
        const hasTerrain =
          tileLookup[buildTileLookupId(coordinate)]?.terrain ?? false
        const hasUnit = tileLookup[buildTileLookupId(coordinate)]?.unit ?? false
        return !hasTerrain && !hasUnit
      })

      const usesSpecial = activatedSpecials.find((special) => {
        assert(match.activePlayer)
        return (
          special.type === "EXPAND_BUILD_RADIUS_BY_1" &&
          match.activePlayer.bonusPoints + (selectedCard?.value ?? 0) >=
            special.cost
        )
      })
      if (usesSpecial) {
        placeableCoordiantes = [
          ...placeableCoordiantes,
          ...getAdjacentCoordinatesOfConstellation(placeableCoordiantes).filter(
            (coordinate) => {
              const hasTerrain =
                tileLookup[buildTileLookupId(coordinate)]?.terrain ?? false
              const hasUnit =
                tileLookup[buildTileLookupId(coordinate)]?.unit ?? false
              return !hasTerrain && !hasUnit
            }
          ),
        ]
      }
      return placeableCoordiantes
    }, [match?.updatedAt, selectedCard, activatedSpecials]) ?? []
  return { placeableCoordinates }
}
