import {
  Box,
  Button,
  ButtonGroup,
  Heading,
  StackProps,
  Text,
  VStack,
} from "@chakra-ui/react"
import { GameSettings } from "@prisma/client"

interface UIPreMatchViewProps extends StackProps {
  settings: GameSettings | null
  userId: string
  createdById: string
  isGameFull: boolean
  onSettingsChange: (mapSize: GameSettings["mapSize"]) => void
  onStartGameClick: () => void
}

export const UIPreMatchView = (props: UIPreMatchViewProps) => {
  const {
    settings,
    userId,
    createdById,
    isGameFull,
    onSettingsChange,
    onStartGameClick,
    ...stackProps
  } = props
  if (!settings) {
    return <Box>No Settings</Box>
  }
  const isHost = userId === createdById
  return (
    <VStack spacing="8" {...stackProps}>
      <Heading>Not Started</Heading>
      {!isHost ? (
        <Text>Waiting for creator to start the game</Text>
      ) : isGameFull ? (
        <Text>Game is full. Ready to start game.</Text>
      ) : (
        <Text color="gray.300">Waiting for other player to join</Text>
      )}
      <VStack>
        <Text fontWeight="bold">Map size</Text>
        <ButtonGroup isAttached>
          <Button
            variant="outline"
            size="sm"
            disabled={!isHost}
            _disabled={{ opacity: 1, cursor: "default" }}
            colorScheme={settings.mapSize === 11 ? "blue" : "gray"}
            onClick={() => onSettingsChange(11)}
          >
            Small
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isHost}
            _disabled={{ opacity: 1, cursor: "default" }}
            colorScheme={settings.mapSize === 21 ? "blue" : "gray"}
            onClick={() => onSettingsChange(21)}
          >
            Medium
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isHost}
            _disabled={{ opacity: 1, cursor: "default" }}
            colorScheme={settings.mapSize === 31 ? "blue" : "gray"}
            onClick={() => onSettingsChange(31)}
          >
            Large
          </Button>
        </ButtonGroup>
      </VStack>

      {/* <VStack>
          <Text>{match?.players[0].slice(-5)}</Text>
          <Text fontStyle={!match?.players[1] ? "italic" : "normal"}>
            {match?.players[1] ? match?.players[1].slice(-5) : "Empty..."}
          </Text>
        </VStack> */}

      {userId === createdById && (
        <Button
          size="lg"
          colorScheme="blue"
          disabled={!isGameFull}
          onClick={() => {
            onStartGameClick()
          }}
        >
          {isGameFull ? "Start Game" : "Waiting for opponent..."}
        </Button>
      )}
    </VStack>
  )
}
