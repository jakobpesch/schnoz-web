import {
  Box,
  BoxProps,
  Button,
  ButtonGroup,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Kbd,
  Text,
  VStack,
} from "@chakra-ui/react"
import Mousetrap from "mousetrap"
import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapContainer } from "../../components/MapContainer"
import { ScoreView } from "../../components/ScoreView"
import { IMatchDoc } from "../../models/Match.model"
import { Terrain } from "../../models/Terrain.model"
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
  startGame,
} from "../../services/GameManagerService"
import { RenderSettings } from "../../services/SettingsService"
import {
  positionCoordinatesAt,
  transformCoordinates,
} from "../../utils/constallationTransformer"
import {
  buildTileId,
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
  const { coordinates, hotkey, tileSize = RenderSettings.tileSize } = props

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
      {...props}
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

const MapTerrains = (props: { terrainTiles: ITile[] }) => {
  let terrain = ""
  return (
    <>
      {props.terrainTiles.map((tile) => {
        if (tile.terrain === Terrain.water) {
          terrain = "🧿"
        }
        if (tile.terrain === Terrain.tree) {
          terrain = "🌳"
        }
        if (tile.terrain === Terrain.stone) {
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

const MapUnits = (props: { match: IMatchDoc; unitTiles: ITile[] }) => {
  return (
    <>
      {props.unitTiles.map((tile) => {
        let unit = ""
        let background = ""
        if (tile.unit?.playerId === props.match.players[0]) {
          unit = "🦁"
          background = "orange.900"
        } else if (tile.unit?.playerId === props.match.players[1]) {
          unit = "🐵"
          background = "teal.900"
        } else {
          unit = "🛖"
          background = "gray.700"
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

const MapHighlights = (props: {
  match: IMatchDoc
  hoveringCoordinate: Coordinate2D | null
  constellation: Coordinate2D[]
  onTileClick: (
    tileId: ITile["id"],
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
            onClick={() =>
              props.onTileClick(buildTileId([row, col]), rotatedClockwise)
            }
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

  const [match, setMatch] = useState<IMatchDoc | null>(null)
  const [selectedConstellation, setSelectedConstellation] = useState<
    Coordinate2D[] | null
  >(availableConstellations[3])
  const hoveringCoordinate = useRef<Coordinate2D | null>(null)

  const terrainTiles = useMemo(() => {
    return match?.map?.tiles.filter((tile) => tile.terrain)
  }, [match?.updatedAt])

  const unitTiles = useMemo(() => {
    return match?.map?.tiles.filter((tile) => tile.unit)
  }, [match?.updatedAt])

  const tileLookup = useMemo(() => {
    return getTileLookup(match?.map?.tiles ?? [])
  }, [match?.updatedAt])

  let userId: string | null = null
  try {
    userId = getCookie("userId")
  } catch {}

  const fetchMatch = async (matchId: string) => {
    try {
      const match = await getMatch(matchId)
      setMatch(match)
    } catch (e: any) {
      console.log(e.message)
    }
  }

  const checkForUpdates = async (match: IMatchDoc) => {
    const updatedMatch = await checkForMatchUpdates(match._id, match.updatedAt)

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
    match?.players.filter((player: string | null) => player !== null).length ===
    2

  const onStartGameClick = async () => {
    if (!userId) {
      return
    }
    setMatch(await startGame(match?._id, userId, settings.mapSize))
  }

  const onBackToMenuClick = async () => {
    router.push("/")
  }

  const onTileClick = async (
    tileId: ITile["id"],
    rotatedClockwise: IUnitConstellation["rotatedClockwise"]
  ) => {
    console.log(tileId, rotatedClockwise)

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
      setMatch(await makeMove(match?._id, tileId, userId, unitConstellation))
      setSelectedConstellation(null)
      setStatus("Placed unit on tile " + tileId)
    } catch (e: any) {
      setStatus(e.message)
      console.log(e.message)
    }
  }

  const yourTurn = userId === match?.activePlayer

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
  const isPreGame = match?.status === "created"

  const wasCreated =
    match?.status === "created" ||
    match?.status === "started" ||
    match?.status === "finished"

  const wasStarted = match?.status === "started" || match?.status === "finished"

  const isOngoing = match?.status === "started"

  const isFinished = match?.status === "finished"

  const PreMatchView = () => {
    return (
      <VStack spacing="8">
        <Heading>Not Started</Heading>
        {userId !== match?.createdBy ? (
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

        {userId === match?.createdBy && (
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
        p="4"
        bg="gray.800"
        spacing="4"
        position="absolute"
        borderRadius="lg"
        top="10"
      >
        <Heading>Finished</Heading>
        <Text>Someone has won. 🤷‍♀️</Text>
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
    if (!yourTurn) {
      return []
    }

    const alliedTiles = match.map.tiles.filter(
      (tile) =>
        tile.unit?.playerId === userId || tile?.unit?.type === "mainBuilding"
    )
    return getAdjacentCoordinatesOfConstellation(
      alliedTiles.map((tile) => [tile.row, tile.col])
    ).filter((coordinate) => {
      const hasTerrain = tileLookup[buildTileId(coordinate)]?.terrain ?? false
      const hasUnit = tileLookup[buildTileId(coordinate)]?.unit ?? false
      return !hasTerrain && !hasUnit
    })
  }, [match?.updatedAt])

  if (!userId) {
    return null
  }

  if (!match) {
    return null
  }

  // const hightlightColor = useMemo(() => {
  //   return yourTurn
  //     ? getPlayerColor(props.match.players, props.userId)
  //     : "gray.500"
  // }, [yourTurn])

  return (
    <Container height="100vh" color="white">
      <Center height="full">
        {isPreGame && <PreMatchView />}
        {isOngoing && (
          <MapContainer id="map-container" match={match}>
            {match && selectedConstellation && (
              <MapHighlights
                match={match}
                hoveringCoordinate={hoveringCoordinate.current}
                constellation={selectedConstellation}
                onTileClick={onTileClick}
              />
            )}
            {placeableCoordinates && (
              <MapPlaceableTiles coordinates={placeableCoordinates} />
            )}
            {terrainTiles && <MapTerrains terrainTiles={terrainTiles} />}
            {unitTiles && <MapUnits match={match} unitTiles={unitTiles} />}
          </MapContainer>
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
                    boxShadow={selected ? "0 0 0 0.1vw white" : undefined}
                    _hover={
                      !selected
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
            <ScoreView players={match.players} scores={match.scores} />
            {/* <Text p="4" position="fixed" top="0" left="0">
              {yourTurn ? "Your turn" : "Opponents turn"}
            </Text> */}
          </>
        )}
        <Flex
          position="fixed"
          bottom="1vw"
          right="1vw"
          direction="column-reverse"
          height="20vw"
          overflowY="scroll"
          pt="4vw"
          css={{
            "-webkit-mask-image":
              "-webkit-gradient(linear, left bottom, left 50%, color-stop(0%, rgba(0,0,0,1)),color-stop(20%, rgba(0,0,0,1)), color-stop(40%, rgba(0,0,0,0)));",
            "&:hover": {
              "-webkit-mask-image":
                "-webkit-gradient(linear, left bottom, left top, color-stop(0%, rgba(0,0,0,1)), color-stop(80%, rgba(0,0,0,1)), color-stop(100%, rgba(0,0,0,0)));",
            },
          }}
        >
          {statusLog.map((status) => (
            <Text fontSize="0.9vw">{status}</Text>
          ))}
        </Flex>
      </Center>
    </Container>
  )
}

export default MatchView
