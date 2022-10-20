import { Box, Text } from "@chakra-ui/react"
import { RenderSettings } from "../services/SettingsService"
import { ITile } from "../types/tile"

const getBackgroundColor = (tile: ITile, players: string[]) => {
  if (tile.unit?.playerId === players[0]) {
    return "red.300"
  }
  if (tile.unit?.playerId === players[1]) {
    return "blue.300"
  }
  return (tile.row + tile.col) % 2 === 0 ? "gray.700" : "gray.800"
}

const getTextColor = (tile: ITile) => {
  return tile.unit ? "gray.800" : "gray.500"
}

interface TileProps {
  tile: ITile
  players: string[]
  onClick: (tile: ITile["id"]) => void
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
