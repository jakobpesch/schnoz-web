import { Box, Flex, HStack, Kbd, Stack, Text } from "@chakra-ui/react"
import { Participant } from "@prisma/client"
import Mousetrap from "mousetrap"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../models/UnitConstellation.model"
import { RenderSettings } from "../../services/SettingsService"
import {
  transformCoordinates,
  translateCoordinatesTo,
} from "../../utils/constallationTransformer"
import { viewFactorWidth } from "../ui/UIScoreView"

const mousePositionToMapCoordinates = (
  mouseX: number,
  mouseY: number,
  tileSizeInPx: number
) => {
  const row = Math.floor(mouseX / tileSizeInPx)
  const col = Math.floor(mouseY / tileSizeInPx)
  return [row, col] as Coordinate2D
}

export interface MapHoveredHighlightsProps {
  player: Participant | null
  hide?: boolean
  constellation: Coordinate2D[] | null
  onTileClick: (
    row: number,
    col: number,
    rotatedClockwise: IUnitConstellation["rotatedClockwise"],
    mirrored: IUnitConstellation["mirrored"]
  ) => void
}

export const MapHoveredHighlights = (props: MapHoveredHighlightsProps) => {
  const [hoveredCoordinate, setHoveredCoordinate] =
    useState<Coordinate2D | null>(null)
  const [rotatedClockwise, setRotationCount] =
    useState<IUnitConstellation["rotatedClockwise"]>(0)
  const [mirrored, setMirrored] =
    useState<IUnitConstellation["mirrored"]>(false)

  const mapContainerElement = document.getElementById("map-container")
  const bounds = mapContainerElement?.getBoundingClientRect()
  const rotate = () => {
    const correctedRotationCount = (
      rotatedClockwise === 3 ? 0 : rotatedClockwise + 1
    ) as IUnitConstellation["rotatedClockwise"]

    setRotationCount(correctedRotationCount)
  }
  const mirror = () => {
    setMirrored(!mirrored)
  }

  useEffect(() => {
    Mousetrap.bind("r", rotate)
  })

  useEffect(() => {
    Mousetrap.bind("e", mirror)
  })

  document.onmousemove = (event: MouseEvent) => {
    if (!bounds) {
      return
    }
    const coordinate = mousePositionToMapCoordinates(
      event.clientY - bounds.top,
      event.clientX - bounds.left,
      RenderSettings.tileSize
    )
    setHoveredCoordinate(coordinate)
  }

  const hoveredCoordinates = useMemo(() => {
    if (props.constellation && hoveredCoordinate) {
      const transformed = transformCoordinates(props.constellation, {
        rotatedClockwise,
        mirrored,
      })
      const translated = translateCoordinatesTo(hoveredCoordinate, transformed)

      return translated
    }
    return []
  }, [props.constellation, hoveredCoordinate, rotatedClockwise, mirrored])

  if (!props.player || props.hide) {
    return null
  }

  return (
    <>
      {props.constellation && (
        <>
          <Box
            position="fixed"
            left={viewFactorWidth(10)}
            top={viewFactorWidth(200)}
            cursor="default"
          >
            <Stack spacing={viewFactorWidth(10)}>
              <HStack
                p={viewFactorWidth(10)}
                borderRadius={viewFactorWidth(10)}
                borderWidth={viewFactorWidth(2)}
                color="gray.100"
                bg="gray.700"
                cursor="pointer"
                onClick={() => rotate()}
              >
                <Kbd
                  borderColor="gray.100"
                  fontSize={viewFactorWidth(30)}
                  userSelect="none"
                >
                  <Text
                  // transform={"rotate(" + 90 * rotatedClockwise + "deg)"}
                  >
                    R
                  </Text>
                </Kbd>
                <Text fontSize={viewFactorWidth(30)} userSelect="none">
                  Rotate
                </Text>
              </HStack>
              <HStack
                p={viewFactorWidth(10)}
                borderRadius={viewFactorWidth(10)}
                borderWidth={viewFactorWidth(2)}
                color="gray.100"
                bg="gray.700"
                cursor="pointer"
                onClick={() => mirror()}
              >
                <Kbd
                  borderColor="gray.100"
                  fontSize={viewFactorWidth(30)}
                  userSelect="none"
                >
                  <Text>E</Text>
                </Kbd>
                <Text fontSize={viewFactorWidth(30)} userSelect="none">
                  Mirror
                </Text>
              </HStack>
            </Stack>
          </Box>
        </>
      )}
      {hoveredCoordinates.map(([row, col]) => {
        return (
          <Flex
            key={row + "_" + col}
            position="absolute"
            align="center"
            justify="center"
            top={row * RenderSettings.tileSize + "px"}
            left={col * RenderSettings.tileSize + "px"}
            width={RenderSettings.tileSize + "px"}
            height={RenderSettings.tileSize + "px"}
            bg={"whiteAlpha.500"}
            opacity={0.6}
            onClick={() =>
              props.onTileClick(row, col, rotatedClockwise, mirrored)
            }
          >
            <Image
              src={
                RenderSettings.getPlayerAppearance(props.player?.playerNumber)
                  .unit
              }
              height="100%"
              width="100%"
            />
            {/* <MapObject
              object={
                RenderSettings.getPlayerAppearance(props.player?.playerNumber)
                  .unit
              }
            /> */}
          </Flex>
        )
      })}
    </>
  )
}
