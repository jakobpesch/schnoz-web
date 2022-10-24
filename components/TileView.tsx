import { Box, BoxProps, Heading } from "@chakra-ui/react"
import { IUnit } from "../models/Unit.model"
import { RenderSettings } from "../services/SettingsService"

interface TileProps extends BoxProps {
  unit?: IUnit
}

const TileView = (props: TileProps) => {
  let unit = null
  if (props.unit?.type === "mainBuilding") {
    unit = "🏠"
  }
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={RenderSettings.tileSize + "px"}
      height={RenderSettings.tileSize + "px"}
      {...props}
    >
      {unit && <Heading>{unit}</Heading>}
    </Box>
  )
}

export default TileView
