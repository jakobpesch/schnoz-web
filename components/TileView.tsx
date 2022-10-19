import { Box, Text } from "@chakra-ui/react"
import { RenderSettings } from "../services/SettingsService"
import { Tile } from "../types/tile"

const getBackgroundColor = (tile: Tile, players: string[]) => {
  if (tile.unit?.playerId === players[0]) {
    return "red.300"
  }
  if (tile.unit?.playerId === players[1]) {
    return "blue.300"
  }
  return (tile.row + tile.col) % 2 === 0 ? "gray.700" : "gray.800"
}

const getTextColor = (tile: Tile) => {
  return tile.unit ? "gray.800" : "gray.500"
}

interface TileProps {
  tile: Tile
  players: string[]
  onClick: (tile: Tile["id"]) => void
}

const TileView = (props: TileProps) => {
  const { tile, players, onClick } = props

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={RenderSettings.tileSize + "px"}
      height={RenderSettings.tileSize + "px"}
      background={getBackgroundColor(tile, players)}
      fontSize="sm"
      fontWeight="bold"
      onClick={() => onClick(tile.id)}
    >
      <Text color={getTextColor(tile)} pointerEvents="none" textAlign="center">
        {tile.row + "," + tile.col}
      </Text>
    </Box>
  )
}

export default TileView
