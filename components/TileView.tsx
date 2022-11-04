import { Box, BoxProps, Heading } from "@chakra-ui/react"
import { useCallback, useEffect } from "react"
import { Terrain } from "../models/Terrain.model"
import { IUnit } from "../models/Unit.model"
import { RenderSettings } from "../services/SettingsService"

interface TileProps extends BoxProps {
  tileId: string
  unit?: IUnit
  terrain?: Terrain
  onTileClick?: (tileId: string) => void
}

const TileView = (props: TileProps) => {
  let unit = null
  if (props.unit?.type === "mainBuilding") {
    unit = "🏠"
  }
  let terrain = null

  if (props.terrain === Terrain.water) {
    terrain = "🧿"
  }
  if (props.terrain === Terrain.tree) {
    terrain = "🌳"
  }
  if (props.terrain === Terrain.stone) {
    terrain = "⚪️"
  }
  const size = RenderSettings.tileSize + "px"
  // const onClick = useCallback(() => {
  //   props.onTileClick(props.tileId)
  // }, [])
  const tileClickProps = props.onTileClick ? { onClick: props.onTileClick } : {}
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={size}
      height={size}
      {...props}
      // {...tileClickProps}
    >
      {unit && <Heading>{unit}</Heading>}
      {terrain && <Heading>{terrain}</Heading>}
    </Box>
  )
}

export default TileView
