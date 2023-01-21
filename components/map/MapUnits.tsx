import { Flex } from "@chakra-ui/react"
import { Participant } from "@prisma/client"
import Image from "next/image"
import { RenderSettings } from "../../services/SettingsService"
import { TileWithUnits } from "../../types/Tile"

export const MapUnits = (props: {
  players: Participant[]
  unitTiles: TileWithUnits[]
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
            // bg={color}
            bg={"rgba(0,0,0,0.1)"}
          >
            <Image src={unit} height="100%" width="100%" />
            {/* <MapObject object={unit} /> */}
          </Flex>
        )
      })}
    </>
  )
}
