import { Box, BoxProps, Center, HStack, Kbd, VStack } from "@chakra-ui/react"
import { Coordinate2D } from "../../models/UnitConstellation.model"
import { RenderSettings } from "../../services/SettingsService"
import { viewFactorWidth } from "./UIScoreView"

interface UnitConstellationViewProps extends BoxProps {
  coordinates: Coordinate2D[]
  hotkey: string
  tileSize?: number
}

const UnitConstellationView = (props: UnitConstellationViewProps) => {
  const {
    coordinates,
    hotkey,
    tileSize = RenderSettings.tileSize,
    ...boxProps
  } = props

  const viewPortWidthFactor = 0.1
  const padding = 10
  const containerSize =
    (tileSize *
      Math.max(
        3,
        Math.max(...coordinates.map(([row, col]) => Math.max(row, col))) + 1
      ) +
      2 * padding) *
      viewPortWidthFactor +
    "vmin"

  return (
    <Box
      background="gray.700"
      borderRadius="0.5vmin"
      borderWidth="0.05vmin"
      borderColor="gray.500"
      position="relative"
      width={containerSize}
      height={containerSize}
      {...boxProps}
    >
      {coordinates.map(([row, col]) => {
        const topOffset =
          (tileSize * row + padding) * viewPortWidthFactor + "vmin"
        const leftOffset =
          (tileSize * col + padding) * viewPortWidthFactor + "vmin"

        return (
          <Box
            key={"unitConstellation_" + row + "_" + col}
            position="absolute"
            top={topOffset}
            left={leftOffset}
            width={viewFactorWidth(tileSize)}
            height={viewFactorWidth(tileSize)}
            background="gray.300"
          />
        )
      })}
      <Kbd
        position="absolute"
        bottom={viewFactorWidth(-5)}
        right={viewFactorWidth(-5)}
        fontSize={viewFactorWidth(15)}
        bg="gray.600"
      >
        {hotkey}
      </Kbd>
    </Box>
  )
}

interface UIConstellationViewProps {
  selectedConstellation: Coordinate2D[] | null
  constellations: Coordinate2D[][]
  readonly?: boolean
  onSelect: (constellation: Coordinate2D[]) => void
}

export const UIConstellationView = (props: UIConstellationViewProps) => (
  <Center position="fixed" zIndex={3} bottom="0" left="0" width="100vmin">
    <HStack
      spacing="1vmin"
      p="1vmin"
      m="1vmin"
      bg="gray.700"
      borderRadius="0.5vmin"
      borderWidth="0.08vmin"
      opacity={props.readonly ? 0.5 : 1}
    >
      {props.constellations.map((constellation, index) => {
        const selected =
          JSON.stringify(constellation) ===
          JSON.stringify(props.selectedConstellation)
        return (
          <UnitConstellationView
            key={"unitConstellationView " + constellation}
            hotkey={`${index + 1}`}
            boxShadow={
              !props.readonly && selected ? "0 0 0 0.1vmin white" : undefined
            }
            _hover={
              !props.readonly && !selected
                ? { boxShadow: "0 0 0 0.1vmin darkgray" }
                : undefined
            }
            coordinates={constellation}
            tileSize={20}
            onClick={() => props.onSelect(constellation)}
          />
        )
      })}
    </HStack>
  </Center>
)
