import { Box, Center, Text, theme } from "@chakra-ui/react"
import { getColor } from "@chakra-ui/theme-tools"
import Mousetrap from "mousetrap"
import { useEffect, useState } from "react"
import { IMap } from "../models/Map.model"
import { ITile } from "../models/Tile.model"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../models/UnitConstellation.model"
import { RenderSettings } from "../services/SettingsService"
import {
  positionCoordinatesAt,
  transformCoordinates,
} from "../utils/constallationTransformer"
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
  map: IMap
  userId: string
  players: string[]
  activePlayer: string
  selectedConstellation: Coordinate2D[] | null
  onTileClick: (tileId: string, unitConstellation: IUnitConstellation) => void
}
const MapView = (props: MapProps) => {
  const {
    map,
    activePlayer,
    players,
    selectedConstellation,
    onTileClick,
    userId,
  } = props
  const tileLookup = getTileLookup(map.tiles)
  const [hoveringTile, setHoveringTile] = useState<Coordinate2D | null>(null)
  const [rotationCount, setRotationCount] =
    useState<IUnitConstellation["rotatedClockwise"]>(0)

  const mapWidth = RenderSettings.tileSize * map.rowCount
  const mapHeight = RenderSettings.tileSize * map.columnCount

  let hoveredCoordinates: Coordinate2D[] = []
  if (selectedConstellation && hoveringTile) {
    const transformed = transformCoordinates(selectedConstellation, {
      rotatedClockwise: rotationCount,
    })
    const translated = positionCoordinatesAt(hoveringTile, transformed)
    hoveredCoordinates = translated
  }

  useEffect(() => {
    const rotate = () => {
      const correctedRotationCount = (
        rotationCount + 1 > 3 ? 0 : rotationCount + 1
      ) as IUnitConstellation["rotatedClockwise"]
      setRotationCount(correctedRotationCount)
    }
    Mousetrap.bind("r", rotate)
  })

  const yourTurn = userId === activePlayer
  const alliedTiles = map.tiles.filter(
    (tile) =>
      tile.unit?.playerId === userId || tile?.unit?.type === "mainBuilding"
  )
  const placeableCoordinates = getAdjacentCoordinatesOfConstellation(
    alliedTiles.map((tile) => [tile.row, tile.col])
  ).filter((coordinate) => {
    const hasTerrain = tileLookup[buildTileId(coordinate)]?.terrain ?? false
    const hasUnit = tileLookup[buildTileId(coordinate)]?.unit ?? false
    return !hasTerrain && !hasUnit
  })

  return (
    <>
      <Center>
        <Box
          borderRadius="xl"
          overflow="hidden"
          display="flex"
          flexWrap="wrap"
          boxShadow={
            "0 0 0px 10px " +
            getColor(theme, getPlayerColor(players, activePlayer))
          }
          width={mapWidth + "px"}
          height={mapHeight + "px"}
          position="relative"
          onMouseLeave={() => setHoveringTile(null)}
        >
          {map.tiles.map((tile) => {
            return (
              <TileView
                id={tile.id}
                key={tile.id}
                unit={tile.unit}
                terrain={tile.terrain}
                cursor={
                  selectedConstellation && hoveringTile ? "none" : "default"
                }
                borderRadius={
                  tile.unit?.type === "playerUnit" ? "md" : undefined
                }
                background={getBackgroundColor(
                  tile.row,
                  tile.col,
                  players,
                  tile.unit?.playerId ?? "",
                  yourTurn,
                  placeableCoordinates
                )}
                onClick={() => {
                  if (selectedConstellation) {
                    onTileClick(tile.id, {
                      coordinates: selectedConstellation,
                      rotatedClockwise: rotationCount,
                    })
                  }
                }}
                onMouseEnter={(e) => {
                  const tileId = (e.target as any).id as ITile["id"]
                  const coordinate = tileId
                    .split("_")
                    .map((value) => parseInt(value)) as Coordinate2D
                  setHoveringTile(coordinate)
                }}
              />
            )
          })}
          {hoveredCoordinates.map(([row, col], index) => {
            return (
              <TileView
                key={"highlight_" + row + "_" + col + "_" + index}
                position="absolute"
                zIndex={1}
                top={row * RenderSettings.tileSize + "px"}
                left={col * RenderSettings.tileSize + "px"}
                background={
                  yourTurn ? getPlayerColor(players, userId) : "gray.500"
                }
                borderRadius="xl"
                pointerEvents="none"
                opacity={0.7}
              />
            )
          })}
        </Box>
      </Center>
    </>
  )
}
export default MapView
