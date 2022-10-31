import { Box, BoxProps, Heading } from "@chakra-ui/react"
import { Terrain } from "../models/Terrain.model"
import { IUnit } from "../models/Unit.model"
import { RenderSettings } from "../services/SettingsService"

interface TileProps extends BoxProps {
  unit?: IUnit
  terrain?: Terrain
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
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={size}
      height={size}
      {...props}
    >
      {unit && <Heading>{unit}</Heading>}
      {terrain && <Heading>{terrain}</Heading>}
    </Box>
  )
}

export default TileView
