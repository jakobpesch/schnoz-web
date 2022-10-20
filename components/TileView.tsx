import { Box } from "@chakra-ui/react"
import { getCookie } from "../services/CookieService"
import { RenderSettings } from "../services/SettingsService"
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
const getPlayerHoverColor = (
  players: string[],
  player: string,
  unit?: string
) => {
  if (unit) {
    return getPlayerColor(players, unit)
  }
  if (player === players[0]) {
    return "red.900"
  }
  if (player === players[1]) {
    return "blue.900"
  }
}

interface TileProps {
  tile: ITile
  activePlayer: string
  players: string[]
  onClick: (tile: ITile["id"]) => void
}

const TileView = (props: TileProps) => {
  const { tile, players, activePlayer, onClick } = props
  const user = (getCookie("userId") as string) ?? ""
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={RenderSettings.tileSize + "px"}
      height={RenderSettings.tileSize + "px"}
      background={getBackgroundColor(
        tile.row,
        tile.col,
        players,
        tile.unit?.playerId
      )}
      fontSize="sm"
      fontWeight="bold"
      onClick={() => onClick(tile.id)}
      _hover={{
        bg: getPlayerHoverColor(players, user, tile.unit?.playerId),
      }}
    />
  )
}

export default TileView
