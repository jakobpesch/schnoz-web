import {
  Button,
  Center,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import MapView from "../../components/MapView"
import { IMatch } from "../../models/Match.model"
import { ITile } from "../../models/Tile.model"
import { getCookie } from "../../services/CookieService"
import {
  getMatch,
  makeMove,
  startGame,
} from "../../services/GameManagerService"

const MatchView = () => {
  const router = useRouter()
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
  const onBackToMenuClick = async () => {
    router.push("/")
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

  const PreMatchView = () => {
    return (
      <VStack spacing="4">
        <Heading>Not Started</Heading>
        {userId !== match.createdBy ? (
          <Text>Waiting for creator to start the game</Text>
        ) : (
          <>
            {allPlayersJoined ? (
              <>
                <Text>Game is full. Ready to start game.</Text>
                <Button
                  onClick={() => {
                    onStartGameClick()
                  }}
                >
                  Start Game
                </Button>
              </>
            ) : (
              <Text>Waiting for other player to join</Text>
            )}
          </>
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
        <Text position="absolute" bottom="4" right="4">
          {status}
        </Text>
        {match.status === "created" && <PreMatchView />}

        {match.status === "started" && (
          <MapView
            players={match.players}
            userId={userId}
            onTileClick={(tileId) => {
              onTileClick(tileId)
            }}
            activePlayer={match.activePlayer}
            map={match.map}
          />
        )}

        {match.status === "finished" && <PostMatchView />}
      </Center>
    </Container>
  )
}

export default MatchView
