import { Box, Center, Text } from "@chakra-ui/react"
import { RenderSettings } from "../services/SettingsService"
import { IMap } from "../models/Map.model"
import TileView from "./TileView"
import { Constellation, Coordinate2D } from "../models/UnitConstellation.model"
import { useEffect, useState } from "react"
import { ITile } from "../models/Tile.model"

const getBackgroundColor = (
  row: number,
  column: number,
  players: string[],
  player?: string
) => {
  if (player) {
    return getPlayerColor(players, player)
  }
  return (row + column) % 2 === 0 ? "gray.700" : "gray.800"
}

const getPlayerColor = (players: string[], player: string) => {
  if (player === players[0]) {
    return "red.300"
  }
  if (player === players[1]) {
    return "blue.300"
  }
}

export const UnitConstellation = (props: { constellation: Constellation }) => {
  const [mousePosition, setMousePosition] = useState([0, 0])
  const handleMouseMove = (event: MouseEvent) => {
    setMousePosition([event.clientX, event.clientY])
  }
  useEffect(() => {
    document.onmousemove = handleMouseMove
  }, [])
  const [mouseX, mouseY] = mousePosition
  RenderSettings.tileSize
  return (
    <Box position="absolute" left={mouseX + "px"} top={mouseY + "px"}>
      <Box position="relative">
        {props.constellation.map((coordinate) => {
          const [row, col] = coordinate
          const topOffset = RenderSettings.tileSize * row + "px"
          const leftOffset = RenderSettings.tileSize * col + "px"
          return (
            <Box
              position="absolute"
              top={topOffset}
              left={leftOffset}
              width={RenderSettings.tileSize}
              height={RenderSettings.tileSize}
              background="red.300"
            >
              {row},{col}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

interface MapProps {
  map: IMap
  userId: string
  players: string[]
  activePlayer: string
  onTileClick: (tileId: string) => void
}
const MapView = (props: MapProps) => {
  const { map, activePlayer, players, onTileClick, userId } = props
  const [hoveringTile, setHoveringTile] = useState<Coordinate2D | null>(null)
  const mapWidth = RenderSettings.tileSize * map.rowCount
  const mapHeight = RenderSettings.tileSize * map.columnCount
  const unitConstellation: Coordinate2D[] = [
    [0, 0],
    [0, 1],
    [1, 2],
  ]
  const placedUnitConstellation: Coordinate2D[] | null =
    hoveringTile !== null
      ? unitConstellation.map(([row, col]) => {
          return [row + hoveringTile[0], col + hoveringTile[1]]
        })
      : null
  const hoveredTiles: Coordinate2D[] =
    hoveringTile && placedUnitConstellation ? placedUnitConstellation : []
  return (
    <>
      <Center>
        <Box
          display="flex"
          flexWrap="wrap"
          boxShadow="0 0 0px 10px #555555"
          width={mapWidth + "px"}
          height={mapHeight + "px"}
          position="relative"
        >
          {hoveredTiles.map(([row, col]) => {
            return (
              <TileView
                key={"highlight_" + row + "_" + col}
                position="absolute"
                top={row * RenderSettings.tileSize + "px"}
                left={col * RenderSettings.tileSize + "px"}
                background="gray.600"
                borderRadius="3xl"
                pointerEvents="none"
              />
            )
          })}
          {map.tiles.map((tile) => {
            return (
              <TileView
                id={tile.id}
                key={tile.id}
                background={getBackgroundColor(
                  tile.row,
                  tile.col,
                  players,
                  tile.unit?.playerId
                )}
                onClick={() => onTileClick(tile.id)}
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
        {userId === activePlayer ? "Your turn" : "Opponents turn"}
      </Text>
    </>
  )
}
export default MapView
