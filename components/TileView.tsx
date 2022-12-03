import { Box, BoxProps, Heading } from "@chakra-ui/react"
import { Terrain, Unit, UnitType } from "@prisma/client"
import { useCallback, useEffect } from "react"

import { IUnit } from "../models/Unit.model"
import { RenderSettings } from "../services/SettingsService"

interface TileProps extends BoxProps {
  tileId: string
  unit?: Unit | null
  terrain?: Terrain | null
  onTileClick?: (tileId: string) => void
}

const TileView = (props: TileProps) => {
  let unit = null
  if (props.unit?.type === UnitType.MAIN_BUILDING) {
    unit = "🏠"
  }
  let terrain = null

  if (props.terrain === Terrain.WATER) {
    terrain = "🧿"
  }
  if (props.terrain === Terrain.TREE) {
    terrain = "🌳"
  }
  if (props.terrain === Terrain.STONE) {
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
