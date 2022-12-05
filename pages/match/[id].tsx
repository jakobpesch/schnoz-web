import {
  Box,
  BoxProps,
  Button,
  ButtonGroup,
  Center,
  Container,
  Flex,
  Heading,
  Kbd,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  Match,
  MatchStatus,
  Participant,
  Terrain,
  UnitType,
} from "@prisma/client"
import Mousetrap from "mousetrap"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer } from "../../components/MapContainer"
import { ScoreView } from "../../components/ScoreView"
import { IMatchDoc } from "../../models/Match.model"
import { ITile } from "../../models/Tile.model"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../models/UnitConstellation.model"
import { getCookie } from "../../services/CookieService"
import {
  checkForMatchUpdates,
  getMatch,
  makeMove,
  startMatch,
} from "../../services/GameManagerService"
import { RenderSettings } from "../../services/SettingsService"
import { MatchRich } from "../../types/Match"
import { TileRich } from "../../types/Tile"
import {
  positionCoordinatesAt,
  transformCoordinates,
} from "../../utils/constallationTransformer"
import {
  buildTileLookupId,
  coordinateIncludedIn,
  getAdjacentCoordinates,
  getAdjacentCoordinatesOfConstellation,
  getTileLookup,
} from "../../utils/coordinateUtils"

const FollowMouse = (props: BoxProps) => {
  const [mousePosition, setMousePosition] = useState([0, 0])
  const handleMouseMove = (event: MouseEvent) => {
    setMousePosition([event.clientX, event.clientY])
  }
  useEffect(() => {
    document.onmousemove = handleMouseMove
  }, [])
  const [mouseX, mouseY] = mousePosition
  return (
    <Box
      position="absolute"
      left={mouseX + "px"}
      top={mouseY + "px"}
      {...props}
    />
  )
}

const mousePositionToMapCoordinates = (
  mouseX: number,
  mouseY: number,
  tileSizeInPx: number
) => {
  const row = Math.floor(mouseX / tileSizeInPx)
  const col = Math.floor(mouseY / tileSizeInPx)
  return [row, col] as Coordinate2D
}

interface UnitConstellationViewProps extends BoxProps {
  coordinates: Coordinate2D[]
  hotkey: string
  tileSize?: number
}

export const UnitConstellationView = (props: UnitConstellationViewProps) => {
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

const availableConstellations: Coordinate2D[][] = [
  [
    [0, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
  ],
  // [ MAKES A WEIRD BUG
  //   [0, 0],
  //   [0, 1],
  //   [0, 0],
  //   [1, 2],
  // ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [2, 0],
    [2, 1],
  ],
]

const MapTerrains = (props: { terrainTiles: TileRich[] }) => {
  let terrain = ""
  return (
    <>
      {props.terrainTiles.map((tile) => {
        if (tile.terrain === Terrain.WATER) {
          terrain = "🧿"
        }
        if (tile.terrain === Terrain.TREE) {
          terrain = "🌳"
        }
        if (tile.terrain === Terrain.STONE) {
          terrain = "⚪️"
        }
        return (
          <Flex
            key={tile.row + "_" + tile.col}
            position="absolute"
            align="center"
            justify="center"
            top={tile.row * RenderSettings.tileSize + "px"}
            left={tile.col * RenderSettings.tileSize + "px"}
            width={RenderSettings.tileSize + "px"}
            height={RenderSettings.tileSize + "px"}
            pointerEvents="none"
          >
            <Heading>{terrain}</Heading>
          </Flex>
        )
      })}
    </>
  )
}

export const getPlayerAppearance = (participant?: Participant) => {
  let unit = ""
  let background = ""
  if (participant?.playerNumber === 0) {
    unit = "🦁"
    background = "orange.900"
  } else if (participant?.playerNumber === 1) {
    unit = "🐵"
    background = "teal.900"
  } else {
    unit = "🛖"
    background = "gray.700"
  }
  return { unit, background }
}

const MapFog = (props: {
  match: MatchRich
  fogTiles: TileRich[]
  halfFogTiles: TileRich[]
}) => {
  return (
    <>
      {props.fogTiles.map((tile) => {
        const coordinate: Coordinate2D = [tile.row, tile.col]
        return (
          <Flex
            key={tile.row + "_" + tile.col}
            position="absolute"
            align="center"
            justify="center"
            top={tile.row * RenderSettings.tileSize + "px"}
            left={tile.col * RenderSettings.tileSize + "px"}
            width={RenderSettings.tileSize + "px"}
            height={RenderSettings.tileSize + "px"}
            pointerEvents="none"
            bg="black"
          />
        )
      })}
      {props.halfFogTiles.map((tile) => {
        const coordinate: Coordinate2D = [tile.row, tile.col]
        return (
          <Flex
            key={tile.row + "_" + tile.col}
            position="absolute"
            align="center"
            justify="center"
            top={tile.row * RenderSettings.tileSize + "px"}
            left={tile.col * RenderSettings.tileSize + "px"}
            width={RenderSettings.tileSize + "px"}
            height={RenderSettings.tileSize + "px"}
            pointerEvents="none"
            opacity={0.5}
            bg="black"
          />
        )
      })}
    </>
  )
}
const MapUnits = (props: { match: MatchRich; unitTiles: TileRich[] }) => {
  return (
    <>
      {props.unitTiles.map((tile) => {
        const { unit, background } = getPlayerAppearance(
          props.match.players.find((player) => player.id === tile.unit?.ownerId)
        )
        return (
          <Flex
            key={tile.row + "_" + tile.col}
            position="absolute"
            align="center"
            justify="center"
            top={tile.row * RenderSettings.tileSize + "px"}
            left={tile.col * RenderSettings.tileSize + "px"}
            width={RenderSettings.tileSize + "px"}
            height={RenderSettings.tileSize + "px"}
            pointerEvents="none"
            bg={background}
          >
            <Heading>{unit}</Heading>
          </Flex>
        )
      })}
    </>
  )
}

const MapPlaceableTiles = (props: { coordinates: Coordinate2D[] }) => {
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
            bg="green"
            pointerEvents="none"
            opacity={0.4}
          />
        )
      })}
    </>
  )
}

const MapHoveredHighlights = (props: {
  match: MatchRich
  readonly?: boolean
  hoveringCoordinate: Coordinate2D | null
  constellation: Coordinate2D[]
  onTileClick: (
    row: number,
    col: number,
    rotatedClockwise: IUnitConstellation["rotatedClockwise"]
  ) => void
}) => {
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
      const translated = positionCoordinatesAt(hoveredCoordinate, transformed)

      return translated
    }
    return []
  }, [hoveredCoordinate, rotatedClockwise])

  if (props.readonly) {
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
          />
        )
      })}
    </>
  )
}

const MapHighlights = (props: {
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

const MapGrid = (props: {
  match: IMatchDoc
  onTileClick: (tileId: ITile["id"]) => void
}) => {
  return (
    <>
      {props.match.map.tiles.map((tile) => {
        return (
          <Flex
            key={tile.row + "_" + tile.col}
            position="absolute"
            align="center"
            justify="center"
            top={tile.row * RenderSettings.tileSize + "px"}
            left={tile.col * RenderSettings.tileSize + "px"}
            width={RenderSettings.tileSize + "px"}
            height={RenderSettings.tileSize + "px"}
            onClick={() => {
              props.onTileClick(tile.id)
            }}
          />
        )
      })}
    </>
  )
}

const MatchView = () => {
  const router = useRouter()
  const setStatus = (status: string) => {
    setStatusLog([
      new Date().toLocaleTimeString() + ": " + status,
      ...statusLog,
    ])
  }
  const [statusLog, setStatusLog] = useState<string[]>([])
  const [settings, setSettings] = useState({
    mapSize: 11,
  })

  const [match, setMatch] = useState<MatchRich | null>(null)
  const [selectedConstellation, setSelectedConstellation] = useState<
    Coordinate2D[] | null
  >(availableConstellations[3])
  const hoveringCoordinate = useRef<Coordinate2D | null>(null)

  const terrainTiles = useMemo(() => {
    return match?.map?.tiles.filter((tile) => tile.terrain && tile.visible)
  }, [match?.updatedAt])

  const unitTiles = useMemo(() => {
    return match?.map?.tiles.filter((tile) => tile.unit && tile.visible)
  }, [match?.updatedAt])

  const fogTiles = useMemo(() => {
    return match?.map?.tiles.filter((tile) => !tile.visible)
  }, [match?.updatedAt])

  const tileLookup = useMemo(() => {
    return getTileLookup(match?.map?.tiles ?? [])
  }, [match?.updatedAt])

  const halfFogTiles: TileRich[] | undefined = useMemo(() => {
    return match?.map?.tiles.filter((tile) => {
      if (!tile.visible) {
        return false
      }
      const coordinate: Coordinate2D = [tile.row, tile.col]
      const adjacentCoordinates = getAdjacentCoordinates(coordinate)
      const hasHiddenAdjacentTile = adjacentCoordinates.some(
        (adjacentCoordinate) =>
          !tileLookup[buildTileLookupId(adjacentCoordinate)].visible
      )
      return tile.visible && hasHiddenAdjacentTile
    })
  }, [match?.updatedAt])

  let userId: string | null = null
  try {
    userId = getCookie("userId")
  } catch (e) {}

  const fetchMatch = async (matchId: string) => {
    try {
      const match = await getMatch(matchId)
      setMatch(match)
    } catch (e: any) {
      console.log(e.message)
    }
  }

  const checkForUpdates = async (match: Match) => {
    const updatedMatch = await checkForMatchUpdates(match.id, match.updatedAt)

    if (updatedMatch) {
      setMatch(updatedMatch)
    }
  }

  useEffect(() => {
    const matchId = window.location.pathname.split("/").pop()
    if (matchId) {
      fetchMatch(matchId)
    }
    Mousetrap.bind("1", () =>
      setSelectedConstellation(availableConstellations[0])
    )
    Mousetrap.bind("2", () =>
      setSelectedConstellation(availableConstellations[1])
    )
    Mousetrap.bind("3", () =>
      setSelectedConstellation(availableConstellations[2])
    )
    Mousetrap.bind("4", () =>
      setSelectedConstellation(availableConstellations[3])
    )
    Mousetrap.bind("5", () =>
      setSelectedConstellation(availableConstellations[4])
    )
    Mousetrap.bind("6", () =>
      setSelectedConstellation(availableConstellations[5])
    )
    Mousetrap.bind("esc", () => setSelectedConstellation(null))
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timer
    if (match) {
      interval = setInterval(() => {
        checkForUpdates(match)
      }, 1000)
    }
    return () => {
      clearInterval(interval)
    }
  }, [match])

  const allPlayersJoined =
    match?.players?.filter((player) => player !== null).length === 2

  const onBackToMenuClick = async () => {
    router.push("/")
  }

  const onTileClick = async (
    row: number,
    col: number,
    rotatedClockwise: IUnitConstellation["rotatedClockwise"]
  ) => {
    if (!userId) {
      return
    }

    if (!selectedConstellation) {
      return
    }

    const unitConstellation: IUnitConstellation = {
      coordinates: selectedConstellation,
      rotatedClockwise,
    }
    try {
      const participantId = match?.players.find(
        (player) => player.userId === userId
      )?.id
      if (!participantId) {
        throw new Error("Participant not found")
      }
      setMatch(
        await makeMove(match!.id, row, col, participantId, unitConstellation)
      )
      setSelectedConstellation(null)
      setStatus(`Placed unit on tile (${row}|${col})`)
    } catch (e: any) {
      setStatus(e.message)
      console.log(e.message)
    }
  }

  const yourTurn = userId === match?.activePlayer?.userId

  const GameSettingsView = () => {
    return (
      <>
        <VStack>
          <Text fontWeight="bold">Map size</Text>
          <ButtonGroup isAttached>
            <Button
              variant="outline"
              size="sm"
              colorScheme={settings.mapSize === 11 ? "blue" : "gray"}
              onClick={() => setSettings({ ...settings, mapSize: 11 })}
            >
              Small
            </Button>
            <Button
              variant="outline"
              size="sm"
              colorScheme={settings.mapSize === 21 ? "blue" : "gray"}
              onClick={() => setSettings({ ...settings, mapSize: 21 })}
            >
              Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              colorScheme={settings.mapSize === 31 ? "blue" : "gray"}
              onClick={() => setSettings({ ...settings, mapSize: 31 })}
            >
              Large
            </Button>
          </ButtonGroup>
        </VStack>
      </>
    )
  }
  const isPreGame = match?.status === MatchStatus.CREATED

  const wasCreated =
    match?.status === MatchStatus.CREATED ||
    match?.status === MatchStatus.STARTED ||
    match?.status === MatchStatus.FINISHED

  const wasStarted =
    match?.status === MatchStatus.STARTED ||
    match?.status === MatchStatus.FINISHED

  const isOngoing = match?.status === MatchStatus.STARTED

  const isFinished = match?.status === MatchStatus.FINISHED

  const PreMatchView = () => {
    return (
      <VStack spacing="8">
        <Heading>Not Started</Heading>
        {userId !== match?.createdById ? (
          <Text>Waiting for creator to start the game</Text>
        ) : (
          <>
            {allPlayersJoined ? (
              <Text>Game is full. Ready to start game.</Text>
            ) : (
              <Text color="gray.300">Waiting for other player to join</Text>
            )}
            <GameSettingsView />
          </>
        )}

        {/* <VStack>
          <Text>{match?.players[0].slice(-5)}</Text>
          <Text fontStyle={!match?.players[1] ? "italic" : "normal"}>
            {match?.players[1] ? match?.players[1].slice(-5) : "Empty..."}
          </Text>
        </VStack> */}

        {userId === match?.createdById && (
          <Button
            size="lg"
            colorScheme="blue"
            disabled={!allPlayersJoined}
            onClick={() => {
              onStartGameClick()
            }}
          >
            {allPlayersJoined ? "Start Game" : "Waiting for opponent..."}
          </Button>
        )}
      </VStack>
    )
  }

  const PostMatchView = () => {
    return (
      <VStack
        p="1vw"
        bg="gray.800"
        spacing="1vw"
        position="absolute"
        borderRadius="0.5vw"
        borderWidth="0.08vw"
        zIndex={2}
        top="10vw"
      >
        <Heading>Finished</Heading>
        <Text fontSize="2vw">
          {
            getPlayerAppearance(
              match?.players.find((player) => player.id === match?.winnerId)
            ).unit
          }{" "}
          wins!
        </Text>
        <Button
          onClick={() => {
            onBackToMenuClick()
          }}
        >
          Back to menu
        </Button>
      </VStack>
    )
  }
  const placeableCoordinates = useMemo(() => {
    if (!yourTurn || !match || !match.map) {
      return []
    }

    const alliedTiles =
      match.map.tiles.filter(
        (tile) =>
          tile.unit?.ownerId === match.activePlayer?.id ||
          tile?.unit?.type === UnitType.MAIN_BUILDING
      ) ?? []

    return getAdjacentCoordinatesOfConstellation(
      alliedTiles.map((tile) => [tile.row, tile.col])
    ).filter((coordinate) => {
      const hasTerrain =
        tileLookup[buildTileLookupId(coordinate)]?.terrain ?? false
      const hasUnit = tileLookup[buildTileLookupId(coordinate)]?.unit ?? false
      return !hasTerrain && !hasUnit
    })
  }, [match?.updatedAt])

  if (!userId) {
    return null
  }

  if (!match) {
    return null
  }

  const onStartGameClick = async () => {
    if (!userId) {
      return
    }

    setMatch(await startMatch(match.id, userId, settings.mapSize))
  }

  return (
    <Container height="100vh" color="white">
      <Center height="full">
        {isPreGame && <PreMatchView />}
        {wasStarted && (
          <>
            <MapContainer id="map-container" match={match}>
              {match && selectedConstellation && yourTurn && (
                <MapHoveredHighlights
                  match={match}
                  readonly={isFinished}
                  hoveringCoordinate={hoveringCoordinate.current}
                  constellation={selectedConstellation}
                  onTileClick={onTileClick}
                />
              )}
              {placeableCoordinates && selectedConstellation && (
                <MapHighlights
                  coordinates={placeableCoordinates}
                  color={"green.900"}
                />
              )}
              {terrainTiles && <MapTerrains terrainTiles={terrainTiles} />}
              {unitTiles && <MapUnits match={match} unitTiles={unitTiles} />}
              {fogTiles && halfFogTiles && (
                <MapFog
                  match={match}
                  fogTiles={fogTiles}
                  halfFogTiles={halfFogTiles}
                />
              )}
            </MapContainer>
            <ScoreView players={match.players} />
          </>
        )}
        {isFinished && <PostMatchView />}
        {isOngoing && (
          <>
            <VStack
              position="fixed"
              zIndex={2}
              left="0"
              spacing="1vw"
              p="1vw"
              m="1vw"
              bg="gray.700"
              borderRadius="0.5vw"
              borderWidth="0.08vw"
            >
              {availableConstellations.map((constellation, index) => {
                const selected =
                  JSON.stringify(constellation) ===
                  JSON.stringify(selectedConstellation)
                return (
                  <UnitConstellationView
                    key={"unitConstellationView " + constellation}
                    hotkey={`${index + 1}`}
                    boxShadow={
                      yourTurn && selected ? "0 0 0 0.1vw white" : undefined
                    }
                    _hover={
                      yourTurn && !selected
                        ? { boxShadow: "0 0 0 0.1vw darkgray" }
                        : undefined
                    }
                    coordinates={constellation}
                    tileSize={20}
                    onClick={() => setSelectedConstellation(constellation)}
                  />
                )
              })}
            </VStack>
          </>
        )}
        <Flex
          position="fixed"
          bottom="1vw"
          right="1vw"
          direction="column-reverse"
          maxHeight="5vw"
          maxWidth="20vw"
          width="20vw"
          overflowY="scroll"
          p="0.5vw"
          m="0.5vw"
          borderRadius="0.5vw"
          borderWidth="0.08vw"
          borderColor="transparent"
          color="gray.500"
          _hover={{
            color: "white",
            bg: "gray.700",
            borderColor: "initial",
            maxHeight: "30vw",
          }}
          css={{
            "-webkit-mask-image":
              "-webkit-gradient(linear, left bottom, left top, color-stop(0%, rgba(0,0,0,1)),color-stop(60%, rgba(0,0,0,1)), color-stop(90%, rgba(0,0,0,0)));",
            "&:hover": {
              "-webkit-mask-image": "none",
            },
          }}
        >
          {statusLog.map((status, index) => (
            <Text key={index} fontSize="0.9vw">
              {status}
            </Text>
          ))}
        </Flex>
      </Center>
    </Container>
  )
}

export default MatchView
