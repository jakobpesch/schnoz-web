import {
  Badge,
  Button,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { Match } from "@prisma/client"
import { MatchWithPlayers } from "../types/Match"

interface MatchListProps {
  userId: string
  matches: Match[]
  onJoinClick: (id: string) => void
  onDeleteClick: (id: string) => void
  onGoToMatchClick: (id: string) => void
}

const MatchList = (props: MatchListProps) => {
  const { userId, matches, onJoinClick, onDeleteClick, onGoToMatchClick } =
    props
  const canJoin = (match: MatchWithPlayers) => {
    return match.players.length === 1
  }
  const canDelete = (match: MatchWithPlayers, userId: string) => {
    return match.createdById === userId
  }
  const hasJoined = (match: MatchWithPlayers, userId: string) => {
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
            <Th>Match ID</Th>
            <Th>Status</Th>
            <Th>Created by</Th>
            <Th>Players</Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {matches?.map((match: any) => {
            return (
              <Tr key={match.id} color="gray.200">
                <Td>{match.id.slice(-5)}</Td>
                <Td>
                  <Badge>{match.status}</Badge>
                </Td>
                <Td>
                  {match.createdById === userId
                    ? "Me"
                    : match.createdById.slice(-5)}
                </Td>
                <Td>{match.players.length} / 2</Td>
                <Td>
                  <Button
                    variant="link"
                    disabled={!canJoin(match)}
                    onClick={() => onJoinClick(match.id)}
                  >
                    Join
                  </Button>
                </Td>
                <Td>
                  <Button
                    variant="link"
                    disabled={!canDelete(match, userId)}
                    onClick={() => onDeleteClick(match.id)}
                  >
                    Delete
                  </Button>
                </Td>
                <Td>
                  <Button
                    variant="link"
                    disabled={!hasJoined(match, userId)}
                    onClick={() => onGoToMatchClick(match.id)}
                  >
                    Go to match
                  </Button>
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
