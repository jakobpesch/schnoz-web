import { Box, BoxProps, Center } from "@chakra-ui/react"
import { RenderSettings } from "../../services/SettingsService"
import { MatchRich } from "../../types/Match"

interface MapContainerProps extends BoxProps {
  match: MatchRich
}
export const MapContainer = (props: MapContainerProps) => {
  const { match, ...boxProps } = props
  if (!match.map) {
    return null
  }
  const { rowCount, colCount } = match.map
  const mapWidth = RenderSettings.tileSize * rowCount
  const mapHeight = RenderSettings.tileSize * colCount
  return (
    <Center height="full">
      <Box
        borderRadius="xl"
        overflow="hidden"
        display="flex"
        flexWrap="wrap"
        boxShadow="0 0 0px 10px #333"
        width={mapWidth + "px"}
        height={mapHeight + "px"}
        flexShrink={0}
        position="relative"
        bgGradient="radial(green.700, green.900)"
        bgPos="right"
        {...boxProps}
      />
    </Center>
  )
}
