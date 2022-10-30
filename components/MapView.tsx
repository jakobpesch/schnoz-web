import { Box, Center, Text } from "@chakra-ui/react"
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
  getAdjacentCoordinatesOfConstellation,
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
    return "gray.500"
  }
  return (row + column) % 2 === 0 ? "gray.700" : "gray.800"
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

  const [hoveringTile, setHoveringTile] = useState<Coordinate2D | null>(null)
  const [rotationCount, setRotationCount] =
    useState<IUnitConstellation["rotatedClockwise"]>(0)

  const mapWidth = RenderSettings.tileSize * map.rowCount
  const mapHeight = RenderSettings.tileSize * map.columnCount

  let hoveredTiles: Coordinate2D[] = []
  if (selectedConstellation && hoveringTile) {
    const transformed = transformCoordinates(selectedConstellation, {
      rotatedClockwise: rotationCount,
    })
    const translated = positionCoordinatesAt(hoveringTile, transformed)
    hoveredTiles = translated
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
  )

  return (
    <>
      <Center>
        <Box
          borderRadius="xl"
          overflow="hidden"
          display="flex"
          flexWrap="wrap"
          boxShadow="0 0 0px 10px #555555"
          width={mapWidth + "px"}
          height={mapHeight + "px"}
          position="relative"
        >
          {hoveredTiles.map(([row, col], index) => {
            return (
              <TileView
                key={"highlight_" + row + "_" + col + "_" + index}
                position="absolute"
                top={row * RenderSettings.tileSize + "px"}
                left={col * RenderSettings.tileSize + "px"}
                background={getPlayerColor(players, userId)}
                borderRadius="xl"
                pointerEvents="none"
                boxShadow={"0 0 0 4px inset white "}
              />
            )
          })}
          {map.tiles.map((tile) => {
            return (
              <TileView
                id={tile.id}
                key={tile.id}
                unit={tile.unit}
                terrain={tile.terrain}
                cursor={hoveringTile ? "none" : "default"}
                borderRadius={
                  tile.unit?.type === "playerUnit" ? "xl" : undefined
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
                onMouseLeave={(e) => {
                  setHoveringTile(null)
                }}
              />
            )
          })}
        </Box>
      </Center>
      <Text p="4" position="fixed" top="0" left="0">
        {yourTurn ? "Your turn" : "Opponents turn"}
      </Text>
    </>
  )
}
export default MapView
