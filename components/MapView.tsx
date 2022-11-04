import { useCallback, useMemo } from "react"
import { IMatchDoc } from "../models/Match.model"
import { ITile } from "../models/Tile.model"
import { Coordinate2D } from "../models/UnitConstellation.model"
import {
  buildTileId,
  getAdjacentCoordinatesOfConstellation,
  getTileLookup,
  includes,
} from "../utils/coordinateUtils"
import TileView from "./TileView"

const getBackgroundColor = (
  row: number,
  column: number,
  players: string[],
  player: string,
  yourTurn: boolean,
  placeableCoordinates: Coordinate2D[]
) => {
  if (player) {
    return getPlayerColor(players, player)
  }
  if (yourTurn && includes(placeableCoordinates, [row, column])) {
    return "green.900"
  }
  return "unset"
}

export const getPlayerColor = (players: string[], player: string) => {
  if (player === players[0]) {
    return "red.300"
  } else {
    return "blue.300"
  }
}

interface MapProps {
  match: IMatchDoc
  userId: string
  selectedConstellation: Coordinate2D[] | null
  onTileClick: (tileId: string) => void
  onTileHover: (e: any) => void
}
const MapView = (props: MapProps) => {
  const tileLookup = useMemo(() => {
    return getTileLookup(props.match.map.tiles)
  }, [props.match.updatedAt])

  const tiles = useMemo(() => {
    return props.match.map.tiles
  }, [props.match.updatedAt])

  const yourTurn = props.userId === props.match.activePlayer

  const hightlightColor = useMemo(() => {
    return yourTurn
      ? getPlayerColor(props.match.players, props.userId)
      : "gray.500"
  }, [yourTurn])

  const placeableCoordinates = useMemo(() => {
    if (!yourTurn) {
      return []
    }

    const alliedTiles = tiles.filter(
      (tile) =>
        tile.unit?.playerId === props.userId ||
        tile?.unit?.type === "mainBuilding"
    )
    return getAdjacentCoordinatesOfConstellation(
      alliedTiles.map((tile) => [tile.row, tile.col])
    ).filter((coordinate) => {
      const hasTerrain = tileLookup[buildTileId(coordinate)]?.terrain ?? false
      const hasUnit = tileLookup[buildTileId(coordinate)]?.unit ?? false
      return !hasTerrain && !hasUnit
    })
  }, [props.match.updatedAt])

  const onClick = useCallback((tileId: ITile["id"]) => {
    props.onTileClick(tileId)
  }, [])

  return (
    <>
      {tiles.map((tile) => {
        return (
          <TileView
            id={tile.id}
            key={tile.id}
            tileId={tile.id}
            unit={tile.unit}
            terrain={tile.terrain}
            borderRadius={tile.unit?.type === "playerUnit" ? "md" : undefined}
            background={getBackgroundColor(
              tile.row,
              tile.col,
              props.match.players,
              tile.unit?.playerId ?? "",
              yourTurn,
              placeableCoordinates
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
