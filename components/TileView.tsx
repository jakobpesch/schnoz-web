import { Box, BoxProps } from "@chakra-ui/react"
import { RenderSettings } from "../services/SettingsService"

interface TileProps extends BoxProps {}

const TileView = (props: TileProps) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={RenderSettings.tileSize + "px"}
      height={RenderSettings.tileSize + "px"}
      {...props}
    />
  )
}

export default TileView
