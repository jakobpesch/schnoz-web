import { Box, BoxProps, Kbd, VStack } from "@chakra-ui/react"
import { Coordinate2D } from "../../models/UnitConstellation.model"
import { RenderSettings } from "../../services/SettingsService"

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

  const viewPortWidthFactor = 0.05
  const padding = 10
  const containerSize =
    (tileSize *
      Math.max(
        3,
        Math.max(...coordinates.map(([row, col]) => Math.max(row, col))) + 1
      ) +
      2 * padding) *
      viewPortWidthFactor +
    "vw"

  return (
    <Box
      background="gray.700"
      borderRadius="0.5vw"
      borderWidth="0.05vw"
      borderColor="gray.500"
      position="relative"
      width={containerSize}
      height={containerSize}
      {...boxProps}
    >
      {coordinates.map(([row, col]) => {
        const topOffset =
          (tileSize * row + padding) * viewPortWidthFactor + "vw"
        const leftOffset =
          (tileSize * col + padding) * viewPortWidthFactor + "vw"

        return (
          <Box
            key={"unitConstellation_" + row + "_" + col}
            position="absolute"
            top={topOffset}
            left={leftOffset}
            width={tileSize * viewPortWidthFactor + "vw"}
            height={tileSize * viewPortWidthFactor + "vw"}
            background="gray.300"
          />
        )
      })}
      <Kbd
        position="absolute"
        bottom={-viewPortWidthFactor * 5 + "vw"}
        right={-viewPortWidthFactor * 5 + "vw"}
        fontSize={viewPortWidthFactor * 15 + "vw"}
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
  <VStack
    position="fixed"
    zIndex={3}
    bottom="0"
    left="0"
    spacing="1vw"
    p="1vw"
    m="1vw"
    bg="gray.700"
    borderRadius="0.5vw"
    borderWidth="0.08vw"
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
            props.readonly && selected ? "0 0 0 0.1vw white" : undefined
          }
          _hover={
            props.readonly && !selected
              ? { boxShadow: "0 0 0 0.1vw darkgray" }
              : undefined
          }
          coordinates={constellation}
          tileSize={20}
          onClick={() => props.onSelect(constellation)}
        />
      )
    })}
  </VStack>
)
