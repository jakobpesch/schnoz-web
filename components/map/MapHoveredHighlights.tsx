import { Flex } from "@chakra-ui/react"
import { Participant } from "@prisma/client"
import Mousetrap from "mousetrap"
import { useState, useEffect, useMemo } from "react"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../models/UnitConstellation.model"
import { RenderSettings } from "../../services/SettingsService"
import {
  transformCoordinates,
  translateCoordinatesTo,
} from "../../utils/constallationTransformer"
import { MapObject } from "./MapObject"

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
    rotatedClockwise: IUnitConstellation["rotatedClockwise"]
  ) => void
}

export const MapHoveredHighlights = (props: MapHoveredHighlightsProps) => {
  const [hoveredCoordinate, setHoveredCoordinate] =
    useState<Coordinate2D | null>(null)
  const [rotatedClockwise, setRotationCount] =
    useState<IUnitConstellation["rotatedClockwise"]>(0)

  const mapContainerElement = document.getElementById("map-container")
  const bounds = mapContainerElement?.getBoundingClientRect()

  useEffect(() => {
    const rotate = () => {
      const correctedRotationCount = (
        rotatedClockwise === 3 ? 0 : rotatedClockwise + 1
      ) as IUnitConstellation["rotatedClockwise"]

      setRotationCount(correctedRotationCount)
    }
    Mousetrap.bind("r", rotate)
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
      })
      const translated = translateCoordinatesTo(hoveredCoordinate, transformed)

      return translated
    }
    return []
  }, [hoveredCoordinate, rotatedClockwise])

  if (!props.player || props.hide) {
    return null
  }

  return (
    <>
      {hoveredCoordinates.map(([row, col]) => {
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
            bg={"gray"}
            opacity={0.4}
            onClick={() => props.onTileClick(row, col, rotatedClockwise)}
          >
            <MapObject
              object={RenderSettings.getPlayerAppearance(props.player!).unit}
            />
          </Flex>
        )
      })}
    </>
  )
}
