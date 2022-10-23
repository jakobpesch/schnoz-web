import {
  Box,
  BoxProps,
  Button,
  ButtonGroup,
  Center,
  Container,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import MapView from "../../components/MapView"
import { IMatch, IMatchDoc } from "../../models/Match.model"
import { ITile } from "../../models/Tile.model"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../models/UnitConstellation.model"
import { getCookie } from "../../services/CookieService"
import {
  getMatch,
  makeMove,
  startGame,
} from "../../services/GameManagerService"
import { RenderSettings } from "../../services/SettingsService"
import { separateCoordinates } from "../../utils/constallationTransformer"

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

interface UnitConstellationViewProps extends BoxProps {
  coordinates: Coordinate2D[]
  tileSize?: number
}

export const UnitConstellationView = (props: UnitConstellationViewProps) => {
  const { coordinates, tileSize = RenderSettings.tileSize } = props

  const padding = 8
  const containerSize =
    tileSize *
      (Math.max(...coordinates.map(([row, col]) => Math.max(row, col))) + 1) +
    2 * padding +
    "px"

  return (
    <Box
      background="gray.500"
      borderRadius="lg"
      position="relative"
      width={containerSize}
      height={containerSize}
      {...props}
    >
      {coordinates.map(([row, col]) => {
        const topOffset = tileSize * row + padding + "px"
        const leftOffset = tileSize * col + padding + "px"

        return (
          <Box
            key={"unitConstellation_" + row + "_" + col}
            position="absolute"
            top={topOffset}
            left={leftOffset}
            width={tileSize + "px"}
            height={tileSize + "px"}
            background="gray.300"
          />
        )
      })}
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

const MatchView = () => {
  const router = useRouter()
  const [status, setStatus] = useState("")
  const [settings, setSettings] = useState({
    mapSize: 11,
  })
  const [selectedConstellation, setSelectedConstellation] = useState<
    Coordinate2D[] | null
  >(availableConstellations[0])
  let userId: string | null = null
  try {
    userId = getCookie("userId")
  } catch {}

  const [match, setMatch] = useState<IMatchDoc | null>(null)
  const fetchMatch = async (matchId: string) => {
    try {
      const match = await getMatch(matchId)
      setMatch(match)
    } catch (e: any) {
      console.log(e.message)
    }
  }
  useEffect(() => {
    const matchId = window.location.pathname.split("/").pop()
    if (!matchId) {
      return
    }
    fetchMatch(matchId)
    const interval = setInterval(() => {
      fetchMatch(matchId)
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  if (!userId) {
    return null
  }

  if (!match) {
    return null
  }

  const allPlayersJoined =
    match.players.filter((player: string | null) => player !== null).length ===
    2

  const onStartGameClick = async () => {
    if (!userId) {
      return
    }
    setMatch(await startGame(match._id, userId, settings.mapSize))
  }

  const onBackToMenuClick = async () => {
    router.push("/")
  }

  const onTileClick = async (
    tileId: ITile["id"],
    unitConstellation: IUnitConstellation
  ) => {
    if (!userId) {
      return
    }
    try {
      setMatch(await makeMove(match._id, tileId, userId, unitConstellation))
      setStatus("Placed unit on tile " + tileId)
    } catch (e: any) {
      setStatus(e.message)
      console.log(e.message)
    }
  }

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

  const PreMatchView = () => {
    return (
      <VStack spacing="8">
        <Heading>Not Started</Heading>
        {userId !== match.createdBy ? (
          <Text>Waiting for creator to start the game</Text>
        ) : (
          <>
            {allPlayersJoined ? (
              <Text>Game is full. Ready to start game.</Text>
            ) : (
              <Text color="gray.300">Waiting for other player to join</Text>
            )}
          </>
        )}
        <GameSettingsView />

        {userId === match.createdBy && (
          <Button
            size="lg"
            colorScheme="blue"
            disabled={!allPlayersJoined}
            onClick={() => {
              onStartGameClick()
            }}
          >
            Start Game
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

  return (
    <Container height="100vh" color="white">
      <Center height="full">
        <Text position="fixed" bottom="4" right="4">
          {status}
        </Text>

        {match.status === "created" && <PreMatchView />}

        {match.status === "started" && (
          <VStack spacing="10">
            <MapView
              selectedConstellation={selectedConstellation}
              players={match.players}
              userId={userId}
              onTileClick={(tileId, unitConstellation) => {
                onTileClick(tileId, unitConstellation)
              }}
              activePlayer={match.activePlayer}
              map={match.map}
            />
            <HStack>
              {availableConstellations.map((constellation) => {
                const selected =
                  JSON.stringify(constellation) ===
                  JSON.stringify(selectedConstellation)
                const selectedBackgroundColor = selected
                  ? { background: "green" }
                  : {}
                return (
                  <UnitConstellationView
                    key={"unitConstellationView " + constellation}
                    // {...selectedBackgroundColor}
                    boxShadow={selected ? "0 0 0 3px white" : undefined}
                    _hover={
                      !selected
                        ? { boxShadow: "0 0 0 3px darkgray" }
                        : undefined
                    }
                    coordinates={constellation}
                    tileSize={20}
                    onClick={() => setSelectedConstellation(constellation)}
                  />
                )
              })}
            </HStack>
          </VStack>
        )}

        {match.status === "finished" && <PostMatchView />}
      </Center>
    </Container>
  )
}

export default MatchView
