import { Button, Flex, Stack, Text } from "@chakra-ui/react"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import MapView from "../components/MapView"
import MatchList from "../components/MatchList"
import { getCookie, setCookie } from "../services/CookieService"
import {
  createMatch,
  deleteMatch,
  getMatches,
  joinMatch,
  signInAnonymously,
} from "../services/GameManagerService"

const Home: NextPage = () => {
  const router = useRouter()
  const [status, setStatus] = useState("")
  const [user, setUser] = useState<string | null>(null)
  const [matches, setMatches] = useState<any[]>([])
  const map = null
  const fetchAnonymousUserId = async () => {
    const anonymousUserId = await signInAnonymously()
    setUser(anonymousUserId)
    setCookie("userId", anonymousUserId, 30)
  }
  const fetchMatches = async () => {
    const matches = await getMatches()
    setMatches(matches as any)
  }
  useEffect(() => {
    if (!getCookie("userId")) {
      fetchAnonymousUserId()
    } else {
      setUser(getCookie("userId"))
    }
    fetchMatches()
  }, [])

  const handleJoinMatch = async (matchId: string) => {
    if (!user) {
      return
    }
    try {
      await joinMatch(matchId, user)
      setStatus("Joined match")
      router.push("/match/" + matchId)
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  const handleCreateMatch = async () => {
    try {
      if (!user) {
        return
      }
      const match = await createMatch(user)
      setStatus("Created match: " + match._id.slice(-5))
      router.push("/match/" + match._id)
    } catch (e: any) {
      setStatus(e.message)
    }
  }
  const handleDeleteMatch = async (matchId: string) => {
    try {
      if (!user) {
        return
      }
      await deleteMatch(matchId, user)
      setStatus("Deleted match: " + matchId.slice(-5))
      fetchMatches()
    } catch (e: any) {
      setStatus(e.message)
    }
  }
  return (
    <Flex width="full" height="100vh" justify="center" align="center">
      <Text position="absolute" bottom="4" right="4">
        {status}
      </Text>
      {user && (
        <Text position="absolute" bottom="4" left="4">
          {user.slice(-5)}
        </Text>
      )}

      <Stack>
        {matches && user && (
          <MatchList
            user={user}
            matches={matches}
            onJoinClick={(matchId) => handleJoinMatch(matchId)}
            onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
          />
        )}
        <Button onClick={handleCreateMatch}>Create Match</Button>
      </Stack>
    </Flex>
  )
}

export default Home
