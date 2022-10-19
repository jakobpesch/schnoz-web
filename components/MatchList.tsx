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

interface MatchListProps {
  user: string
  matches: any[]
  onJoinClick: (id: string) => void
  onDeleteClick: (id: string) => void
}

const MatchList = (props: MatchListProps) => {
  const { user, matches, onJoinClick, onDeleteClick } = props
  const canJoin = (match: any) => match.players.length === 1
  const canDelete = (match: any, user: string) => match.creator === user
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
            <Th>Creator</Th>
            <Th>Players</Th>
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
                  {match.creator === user ? "Me" : match.creator.slice(-5)}
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
                    disabled={!canDelete(match, user)}
                    onClick={() => onDeleteClick(match._id)}
                  >
                    Delete
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
