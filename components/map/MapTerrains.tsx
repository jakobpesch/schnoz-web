import { Flex } from "@chakra-ui/react"
import { Terrain } from "@prisma/client"
import Image, { StaticImageData } from "next/image"
import terrainStone from "../../assets/sprites/terrain_stone.png"
import terrainTree from "../../assets/sprites/terrain_tree.png"
import terrainWater from "../../assets/sprites/terrain_water.png"
import { RenderSettings } from "../../services/SettingsService"
import { TileWithUnits } from "../../types/Tile"

export const MapTerrains = (props: { terrainTiles: TileWithUnits[] }) => {
  let terrain: StaticImageData
  return (
    <>
      {props.terrainTiles.map((tile) => {
        if (tile.terrain === Terrain.WATER) {
          terrain = terrainWater
        }
        if (tile.terrain === Terrain.TREE) {
          terrain = terrainTree
        }
        if (tile.terrain === Terrain.STONE) {
          terrain = terrainStone
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
            <Image src={terrain} height="100%" width="100%" />
            {/* <MapObject object={terrain} /> */}
          </Flex>
        )
      })}
    </>
  )
}
