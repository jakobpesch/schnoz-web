import { Box, Center } from "@chakra-ui/react"
import { RenderSettings } from "../services/SettingsService"
import { IMap } from "../models/Map.model"
import TileView from "./TileView"

interface MapProps {
  map: IMap
  userId: string
  players: string[]
  activePlayer: string
  onTileClick: (tileId: string) => void
}
const MapView = (props: MapProps) => {
  const { map, activePlayer, players, onTileClick, userId } = props
  const mapWidth = RenderSettings.tileSize * map.rowCount
  const mapHeight = RenderSettings.tileSize * map.columnCount

  return (
    <>
      <Center>
        <Box
          display="flex"
          flexWrap="wrap"
          boxShadow="0 0 0px 10px #555555"
          width={mapWidth + "px"}
          height={mapHeight + "px"}
        >
          {map.tiles.map((tile) => {
            return (
              <TileView
                key={tile.id}
                activePlayer={activePlayer}
                players={players}
                tile={tile}
                onClick={onTileClick}
              />
            )
          })}
        </Box>
      </Center>
      <Box p="4" position="absolute" top="0" left="0">
        {userId === activePlayer ? "Your turn" : "Opponents turn"}
      </Box>
    </>
  )
}
export default MapView
