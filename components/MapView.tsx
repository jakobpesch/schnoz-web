import { Participant, UnitType } from "@prisma/client"
import { useCallback, useMemo } from "react"
import { ITile } from "../models/Tile.model"
import { Coordinate2D } from "../models/UnitConstellation.model"
import { MatchRich } from "../types/Match"
import {
  buildTileLookupId,
  getAdjacentCoordinatesOfConstellation,
  getTileLookup,
  coordinateIncludedIn,
} from "../utils/coordinateUtils"
import TileView from "./TileView"

const getBackgroundColor = (
  row: number,
  column: number,
  yourTurn: boolean,
  placeableCoordinates: Coordinate2D[],
  participant?: Participant
) => {
  if (participant) {
    return getPlayerColor(participant)
  }
  if (yourTurn && coordinateIncludedIn(placeableCoordinates, [row, column])) {
    return "green.900"
  }
  return "unset"
}

export const getPlayerColor = (participant: Participant) => {
  if (participant.playerNumber === 0) {
    return "red.300"
  } else {
    return "blue.300"
  }
}

interface MapProps {
  match: MatchRich
  userId: string
  selectedConstellation: Coordinate2D[] | null
  onTileClick: (tileId: string) => void
  onTileHover: (e: any) => void
}
const MapView = (props: MapProps) => {
  const tileLookup = useMemo(() => {
    return getTileLookup(props.match.map?.tiles ?? [])
  }, [props.match.updatedAt])

  const tiles = useMemo(() => {
    return props.match.map?.tiles
  }, [props.match.updatedAt])

  const yourTurn = props.userId === props.match.activePlayerId

  const placeableCoordinates = useMemo(() => {
    if (!yourTurn || !tiles) {
      return []
    }

    const alliedTiles = tiles.filter(
      (tile) =>
        tile.unit?.ownerId === props.userId ||
        tile?.unit?.type === UnitType.MAIN_BUILDING
    )
    return getAdjacentCoordinatesOfConstellation(
      alliedTiles.map((tile) => [tile.row, tile.col])
    ).filter((coordinate) => {
      const hasTerrain =
        tileLookup[buildTileLookupId(coordinate)]?.terrain ?? false
      const hasUnit = tileLookup[buildTileLookupId(coordinate)]?.unit ?? false
      return !hasTerrain && !hasUnit
    })
  }, [props.match.updatedAt])

  const onClick = useCallback((tileId: ITile["id"]) => {
    props.onTileClick(tileId)
  }, [])

  if (!tiles) {
    return null
  }
  return (
    <>
      {tiles.map((tile) => {
        const owner = props.match.players?.find(
          (player) => player.id === tile.unit?.ownerId
        )

        return (
          <TileView
            id={tile.id}
            key={tile.id}
            tileId={tile.id}
            unit={tile.unit}
            terrain={tile.terrain}
            borderRadius={tile.unit?.type === UnitType.UNIT ? "md" : undefined}
            background={getBackgroundColor(
              tile.row,
              tile.col,
              yourTurn,
              placeableCoordinates,
              owner
            )}
            onTileClick={onClick}
            onMouseEnter={props.onTileHover}
          />
        )
      })}
    </>
  )
}
export default MapView
