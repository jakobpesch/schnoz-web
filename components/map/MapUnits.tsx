import { Flex, Heading } from "@chakra-ui/react"
import { Participant } from "@prisma/client"
import { RenderSettings } from "../../services/SettingsService"
import { TileRich } from "../../types/Tile"
import { MapObject } from "./MapObject"

export const MapUnits = (props: {
  players: Participant[]
  unitTiles: TileRich[]
}) => {
  return (
    <>
      {props.unitTiles.map((tile) => {
        const { unit, color } = RenderSettings.getPlayerAppearance(
          props.players.find((player) => player.id === tile.unit?.ownerId)
            ?.playerNumber
        )
        return (
          <Flex
            key={tile.row + "_" + tile.col}
            position="absolute"
            align="center"
            justify="center"
            top={tile.row * RenderSettings.tileSize + "px"}
            left={tile.col * RenderSettings.tileSize + "px"}
            width={RenderSettings.tileSize + "px"}
            height={RenderSettings.tileSize + "px"}
            pointerEvents="none"
            bg={color}
          >
            <MapObject object={unit} />
          </Flex>
        )
      })}
    </>
  )
}
