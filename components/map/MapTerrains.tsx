import { Flex, Heading } from "@chakra-ui/react"
import { Terrain } from "@prisma/client"
import { RenderSettings } from "../../services/SettingsService"
import { TileRich } from "../../types/Tile"
import { MapObject } from "./MapObject"

export const MapTerrains = (props: { terrainTiles: TileRich[] }) => {
  let terrain = ""
  return (
    <>
      {props.terrainTiles.map((tile) => {
        if (tile.terrain === Terrain.WATER) {
          terrain = "🧿"
        }
        if (tile.terrain === Terrain.TREE) {
          terrain = "🌳"
        }
        if (tile.terrain === Terrain.STONE) {
          terrain = "⚪️"
        }
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
          >
            <MapObject object={terrain} />
          </Flex>
        )
      })}
    </>
  )
}
