import {
  Badge,
  Button,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { MatchStatus } from "@prisma/client"
import { MatchRich } from "../types/Match"

interface MatchListProps {
  userId: string
  matches: MatchRich[]
  onJoinClick: (id: string) => void
  onDeleteClick: (id: string) => void
  onGoToMatchClick: (id: string) => void
}

const MatchList = (props: MatchListProps) => {
  const { userId, matches, onJoinClick, onDeleteClick, onGoToMatchClick } =
    props
  const canJoin = (match: MatchRich) => {
    return (
      match.players.length === 1 &&
      !match.players.some((player) => player.userId === userId)
    )
  }
  const canDelete = (match: MatchRich, userId: string) => {
    return match.createdById === userId
  }
  const hasJoined = (match: MatchRich, userId: string) => {
    return match.players.some((participant) => participant.userId === userId)
  }
  if (matches.length === 0) {
    return (
      <Text p={10} textAlign="center" color="gray.200">
        No matches
      </Text>
    )
  }

  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Created</Th>
            <Th>Match ID</Th>
            <Th>Status</Th>
            <Th>Created by</Th>
            <Th>Players</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {matches?.map((match) => {
            return (
              <Tr key={match.id} color="gray.200">
                <Td>
                  {new Date(match.createdAt)
                    .toLocaleString()
                    .split(", ")
                    .map((t) => (
                      <Text>{t}</Text>
                    ))}
                </Td>
                <Td>{match.id.slice(-5)}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      match.status === MatchStatus.CREATED
                        ? "orange"
                        : match.status === MatchStatus.STARTED
                        ? "green"
                        : "gray"
                    }
                  >
                    {match.status}
                  </Badge>
                </Td>
                <Td>
                  {match.createdById === userId
                    ? "Me"
                    : match.createdById.slice(-5)}
                </Td>
                <Td>{match.players.length} / 2</Td>

                <Td>
                  <HStack>
                    <Button
                      variant="link"
                      disabled={!canJoin(match)}
                      onClick={() => onJoinClick(match.id)}
                    >
                      Join
                    </Button>
                    <Button
                      variant="link"
                      disabled={!canDelete(match, userId)}
                      onClick={() => onDeleteClick(match.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="link"
                      disabled={!hasJoined(match, userId)}
                      onClick={() => onGoToMatchClick(match.id)}
                    >
                      Go to match
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

export default MatchList
