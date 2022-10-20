import {
  Box,
  Button,
  Center,
  Container,
  FormControl,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import MapView from "../../components/MapView"
import { getCookie } from "../../services/CookieService"
import {
  getMatch,
  makeMove,
  startGame,
} from "../../services/GameManagerService"
import { ITile } from "../../types/tile"
import { IMatch } from "../../types/match"

const MatchView = () => {
  const [status, setStatus] = useState("")
  let userId: string | null = null
  try {
    userId = getCookie("userId")
  } catch {}

  const [match, setMatch] = useState<IMatch | null>(null)
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

  const hasStarted = match.status === "started"
  const hasMap = match.map !== undefined
  const allPlayersJoined =
    match.players.filter((player: string | null) => player !== null).length ===
    2

  const onStartGameClick = async () => {
    if (!userId) {
      return
    }
    setMatch(await startGame(match._id, userId))
  }

  const onTileClick = async (tileId: ITile["id"]) => {
    if (!userId) {
      return
    }
    try {
      setMatch(await makeMove(match._id, tileId, userId))
      setStatus("Placed unit on tile " + tileId)
    } catch (e: any) {
      setStatus(e.message)
      console.log(e.message)
    }
  }

  if (!hasMap || !hasStarted) {
    return (
      <Container height="100vh" color="white">
        <Center height="full">
          <VStack spacing="4">
            <Heading>Not Started</Heading>
            {userId !== match.createdBy ? (
              <Text>Waiting for creator to start the game</Text>
            ) : (
              <>
                {allPlayersJoined ? (
                  <Text>Game is full. Ready to start game.</Text>
                ) : (
                  <Text>Waiting for other player to join</Text>
                )}
                <Button
                  onClick={() => {
                    onStartGameClick()
                  }}
                >
                  Start Game
                </Button>
              </>
            )}
          </VStack>
        </Center>
      </Container>
    )
  }

  return (
    <>
      <Text position="absolute" bottom="4" right="4">
        {status}
      </Text>
      <MapView
        players={match.players}
        userId={userId}
        onTileClick={(tileId) => {
          onTileClick(tileId)
        }}
        activePlayer={match.activePlayer}
        map={match.map}
      />
    </>
  )
}

export default MatchView
