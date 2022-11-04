import { Box, BoxProps } from "@chakra-ui/react"
import { IMatchDoc } from "../models/Match.model"
import { RenderSettings } from "../services/SettingsService"

interface MapContainerProps extends BoxProps {
  match: IMatchDoc
}
export const MapContainer = (props: MapContainerProps) => {
  const { match, ...boxProps } = props
  const mapWidth = RenderSettings.tileSize * props.match.map.rowCount
  const mapHeight = RenderSettings.tileSize * props.match.map.columnCount
  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      display="flex"
      flexWrap="wrap"
      boxShadow="0 0 0px 10px #63B3ED"
      width={mapWidth + "px"}
      height={mapHeight + "px"}
      flexShrink={0}
      position="relative"
      // onMouseLeave={() => setHoveringCoordinate(null)}
      {...boxProps}
    />
  )
}
