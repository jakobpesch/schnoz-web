import { AddIcon, RepeatIcon } from "@chakra-ui/icons"
import {
  Button,
  Container,
  Flex,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react"
import { MatchStatus } from "@prisma/client"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import MatchList from "../components/MatchList"
import { getCookie, setCookie } from "../services/CookieService"
import {
  createMatch,
  deleteMatch,
  getMatches,
  joinMatch,
  signInAnonymously,
} from "../services/GameManagerService"
import { MatchRich } from "../types/Match"

const Home: NextPage = () => {
  const router = useRouter()
  const [status, setStatus] = useState("")
  const [user, setUser] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchRich[]>([])
  const fetchAnonymousUserId = async () => {
    const anonymousUser = await signInAnonymously()
    setUser(anonymousUser.id)
    setCookie("userId", anonymousUser.id, 30)
  }
  const fetchMatches = async () => {
    const matches = await getMatches()
    setMatches(matches as any)
  }
  useEffect(() => {
    if (!getCookie("userId")) {
      // @todo happens two times
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

      setStatus("Created match: " + match.id.slice(-5))
      router.push("/match/" + match.id)
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

  const handleGoToMatch = async (matchId: string) => {
    try {
      if (!user) {
        return
      }
      router.push("/match/" + matchId)
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  return (
    <Flex pt="16" width="full" height="100vh" justify="center">
      <Text position="absolute" bottom="4" right="4">
        {status}
      </Text>
      {user && (
        <Text position="fixed" bottom="4" left="4">
          {user.slice(-5)}
        </Text>
      )}

      <Stack width="4xl" spacing="4" alignItems="center">
        <Heading fontFamily="Geodesic" fontSize="90px" color="teal.700">
          schnoz
        </Heading>
        <Stack direction="row">
          <Button size="sm" onClick={handleCreateMatch} leftIcon={<AddIcon />}>
            Create Match
          </Button>
          <Button
            size="sm"
            onClick={() => fetchMatches()}
            leftIcon={<RepeatIcon />}
          >
            Refresh
          </Button>
        </Stack>
        <Container
          maxWidth="full"
          borderColor="gray.700"
          borderRadius="lg"
          bg="gray.900"
          borderWidth="4px"
        >
          {matches && user && (
            <Tabs align="center" width="full" py="4">
              <TabList>
                <Tab>All</Tab>
                <Tab>Open</Tab>
                <Tab>Ongoing</Tab>
                <Tab>Finished</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <MatchList
                    userId={user}
                    matches={matches}
                    onJoinClick={(matchId) => handleJoinMatch(matchId)}
                    onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
                    onGoToMatchClick={(matchId) => handleGoToMatch(matchId)}
                  />
                </TabPanel>
                <TabPanel>
                  <MatchList
                    userId={user}
                    matches={matches.filter(
                      (match) => match.status === MatchStatus.CREATED
                    )}
                    onJoinClick={(matchId) => handleJoinMatch(matchId)}
                    onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
                    onGoToMatchClick={(matchId) => handleGoToMatch(matchId)}
                  />
                </TabPanel>
                <TabPanel>
                  <MatchList
                    userId={user}
                    matches={matches.filter(
                      (match) => match.status === MatchStatus.STARTED
                    )}
                    onJoinClick={(matchId) => handleJoinMatch(matchId)}
                    onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
                    onGoToMatchClick={(matchId) => handleGoToMatch(matchId)}
                  />
                </TabPanel>
                <TabPanel>
                  <MatchList
                    userId={user}
                    matches={matches.filter(
                      (match) => match.status === MatchStatus.FINISHED
                    )}
                    onJoinClick={(matchId) => handleJoinMatch(matchId)}
                    onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
                    onGoToMatchClick={(matchId) => handleGoToMatch(matchId)}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </Container>
      </Stack>
    </Flex>
  )
}

export default Home
