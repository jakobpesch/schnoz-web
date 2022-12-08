import { Flex } from "@chakra-ui/react"
import { Coordinate2D } from "../../models/UnitConstellation.model"
import { RenderSettings } from "../../services/SettingsService"

export const MapHighlights = (props: {
  coordinates: Coordinate2D[]
  color?: string
}) => {
  return (
    <>
      {props.coordinates.map(([row, col]) => {
        return (
          <Flex
            key={row + "_" + col}
            position="absolute"
            zIndex={1}
            align="center"
            justify="center"
            top={row * RenderSettings.tileSize + "px"}
            left={col * RenderSettings.tileSize + "px"}
            width={RenderSettings.tileSize + "px"}
            height={RenderSettings.tileSize + "px"}
            bg={props.color ?? "gray"}
            pointerEvents="none"
            opacity={0.4}
          />
        )
      })}
    </>
  )
}