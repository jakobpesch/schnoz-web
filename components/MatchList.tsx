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
import { IMatch } from "../models/Match.model"

interface MatchListProps {
  userId: string
  matches: IMatch[]
  onJoinClick: (id: string) => void
  onDeleteClick: (id: string) => void
  onGoToMatchClick: (id: string) => void
}

const MatchList = (props: MatchListProps) => {
  const { userId, matches, onJoinClick, onDeleteClick, onGoToMatchClick } =
    props
  const canJoin = (match: IMatch) => match.players.length === 1
  const canDelete = (match: IMatch, user: string) => match.createdBy === user
  const hasJoined = (match: IMatch, user: string) =>
    match.players.includes(user)
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
              <Tr key={match._id} color="gray.200">
                <Td>{match._id.slice(-5)}</Td>
                <Td>
                  <Badge>{match.status}</Badge>
                </Td>
                <Td>
                  {match.createdBy === userId
                    ? "Me"
                    : match.createdBy.slice(-5)}
                </Td>
                <Td>{match.players.length} / 2</Td>
                <Td>
                  <Button
                    variant="link"
                    disabled={!canJoin(match)}
                    onClick={() => onJoinClick(match._id)}
                  >
                    Join
                  </Button>
                </Td>
                <Td>
                  <Button
                    variant="link"
                    disabled={!canDelete(match, userId)}
                    onClick={() => onDeleteClick(match._id)}
                  >
                    Delete
                  </Button>
                </Td>
                <Td>
                  <Button
                    variant="link"
                    disabled={!hasJoined(match, userId)}
                    onClick={() => onGoToMatchClick(match._id)}
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
