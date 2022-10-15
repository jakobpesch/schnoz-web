import { RenderSettings } from "../services/SettingsService"
import { useState } from "react"
import { Box, Button } from "@chakra-ui/react"
import { Map } from "../types/map"
import TileView from "./TileView"
import { Tile } from "../types/tile"
import { PlayerId } from "../types/player"

const initialiseMap = (rowCount: number, columnCount: number) => {
  const rowIndices = [...Array(rowCount).keys()]
  const columnIndices = [...Array(columnCount).keys()]
  const map: Map = {}
  rowIndices.forEach((iRow) => {
    columnIndices.forEach((iCol) => {
      const id = `${iRow}_${iCol}`
      map[id] = { id: id, row: iRow, col: iCol }
    })
  })
  return map
}

const placeUnit = (map: Map, tile: Tile, playerId: PlayerId) => {
  return { ...map, [tile.id]: { ...map[tile.id], unit: { playerId } } }
}

interface MapProps {
  rowCount: number
  columnCount: number
  onUpdateStatus: (status: string) => void
}
const MapView = (props: MapProps) => {
  const { rowCount, columnCount, onUpdateStatus } = props

  const [map, setMap] = useState(initialiseMap(rowCount, columnCount))
  const [currentPlayerId, setCurrentPlayerId] = useState<PlayerId>(0)

  const mapWidth = RenderSettings.tileSize * rowCount
  const mapHeight = RenderSettings.tileSize * columnCount

  const onTileClick = (id: Tile["id"]) => {
    const tile = map[id]
    if (tile.unit) {
      onUpdateStatus("Cannot place on tile with unit")
      return
    } else {
      setMap(placeUnit(map, map[id], currentPlayerId))
      onUpdateStatus('Placed unit on tile "' + id + '"')
    }
    setCurrentPlayerId(currentPlayerId === 0 ? 1 : 0)
  }

  const reset = () => {
    setMap(initialiseMap(rowCount, columnCount))
    setCurrentPlayerId(0)
  }

  return (
    <>
      <Box
        display="flex"
        flexWrap="wrap"
        boxShadow="0 0 0px 10px #555555"
        width={mapWidth + "px"}
        height={mapHeight + "px"}
      >
        {Object.values(map).map((tile) => {
          return <TileView key={tile.id} tile={tile} onClick={onTileClick} />
        })}
      </Box>
      <Box position="absolute" top="4" right="4">
        <Button onClick={reset}>Reset</Button>
      </Box>
    </>
  )
}
export default MapView
