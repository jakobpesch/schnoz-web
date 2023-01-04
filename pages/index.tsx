import { AddIcon, RepeatIcon } from "@chakra-ui/icons"
import {
  Button,
  Center,
  Container,
  Flex,
  Heading,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react"
import { MatchStatus, User } from "@prisma/client"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import useSWR from "swr"
import MatchList from "../components/MatchList"
import { getCookie } from "../services/CookieService"
import {
  createMatch,
  deleteMatch,
  joinMatch,
  signInAnonymously,
} from "../services/GameManagerService"
import { fetcher } from "../services/swrUtils"
import { MatchWithPlayers } from "../types/Match"

const Home: NextPage = () => {
  const router = useRouter()
  const [status, setStatus] = useState("")

  const [isCreatingMatch, setIsCreatingMatch] = useState(false)

  const {
    data: user,
    error,
    mutate: userMutate,
  } = useSWR<User>(() => {
    const userId = getCookie("userId")
    return "/api/user/" + userId
  }, fetcher)

  useEffect(() => {
    const userCookie = getCookie("userId")
    if (!userCookie || error?.cause?.status === 404) {
      userMutate(signInAnonymously)
    }
  }, [error?.cause?.status])

  const {
    data: matches,
    error: isError,
    isLoading: isLoadingInitially,
    isValidating,
    mutate,
  } = useSWR<MatchWithPlayers[]>("/api/matches", fetcher)

  if (!user) {
    return null
  }

  const handleJoinMatch = async (matchId: string) => {
    if (!user) {
      return
    }
    try {
      await joinMatch(matchId, user.id)
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
      setIsCreatingMatch(true)
      const match = await createMatch(user.id)
      router.push("/match/" + match.id)
    } catch (e: any) {
      setIsCreatingMatch(false)
      setStatus(e.message)
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    try {
      if (!user) {
        return
      }
      await deleteMatch(matchId, user.id)
      setStatus("Deleted match: " + matchId.slice(-5))
      mutate()
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

  const sortedMatches = !matches
    ? []
    : [...matches].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

  return (
    <Flex pt="16" width="full" height="100vh" justify="center">
      <Text position="absolute" bottom="4" right="4">
        {status}
      </Text>
      {user && (
        <Text position="fixed" bottom="4" left="4">
          {user.id.slice(-5)}
        </Text>
      )}

      <Stack width="4xl" spacing="4" alignItems="center">
        <Heading fontFamily="Geodesic" fontSize="90px" color="teal.700">
          schnoz
        </Heading>
        <Stack direction="row">
          <Button
            size="sm"
            onClick={handleCreateMatch}
            leftIcon={<AddIcon />}
            isLoading={isCreatingMatch}
          >
            Create Match
          </Button>
          <Button
            disabled={isLoadingInitially}
            isLoading={isValidating}
            size="sm"
            onClick={() => mutate()}
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
          {isLoadingInitially ? (
            <Center height="md">
              <Spinner />
            </Center>
          ) : (
            matches &&
            user && (
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
                      userId={user.id}
                      matches={sortedMatches}
                      onJoinClick={(matchId) => handleJoinMatch(matchId)}
                      onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
                      onGoToMatchClick={(matchId) => handleGoToMatch(matchId)}
                    />
                  </TabPanel>
                  <TabPanel>
                    <MatchList
                      userId={user.id}
                      matches={sortedMatches.filter(
                        (match) => match.status === MatchStatus.CREATED
                      )}
                      onJoinClick={(matchId) => handleJoinMatch(matchId)}
                      onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
                      onGoToMatchClick={(matchId) => handleGoToMatch(matchId)}
                    />
                  </TabPanel>
                  <TabPanel>
                    <MatchList
                      userId={user.id}
                      matches={sortedMatches.filter(
                        (match) => match.status === MatchStatus.STARTED
                      )}
                      onJoinClick={(matchId) => handleJoinMatch(matchId)}
                      onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
                      onGoToMatchClick={(matchId) => handleGoToMatch(matchId)}
                    />
                  </TabPanel>
                  <TabPanel>
                    <MatchList
                      userId={user.id}
                      matches={sortedMatches.filter(
                        (match) => match.status === MatchStatus.FINISHED
                      )}
                      onJoinClick={(matchId) => handleJoinMatch(matchId)}
                      onDeleteClick={(matchId) => handleDeleteMatch(matchId)}
                      onGoToMatchClick={(matchId) => handleGoToMatch(matchId)}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )
          )}
        </Container>
      </Stack>
    </Flex>
  )
}

export default Home
