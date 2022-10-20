import { Box, Center } from "@chakra-ui/react"
import { RenderSettings } from "../services/SettingsService"
import { IMap } from "../types/map"
import { ITile } from "../types/tile"
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

  const tileLookup: { [id: ITile["id"]]: ITile } = map.tiles.reduce(
    (acc, cur) => {
      return { ...acc, [cur.id]: cur }
    },
    {}
  )

  const mapWidth = RenderSettings.tileSize * map.rowCount
  const mapHeight = RenderSettings.tileSize * map.columnCount

  return (
    <>
      <Center height="100vh">
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
