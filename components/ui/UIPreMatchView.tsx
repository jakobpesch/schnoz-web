import { Button, ButtonGroup, Heading, Text, VStack } from "@chakra-ui/react"
import { MatchSettings } from "../../services/SettingsService"

interface UIPreMatchViewProps {
  settings: MatchSettings
  userId: string
  createdById: string
  isGameFull: boolean
  onSettingsChange: (settings: MatchSettings) => void
  onStartGameClick: () => void
}

export const UIPreMatchView = (props: UIPreMatchViewProps) => {
  return (
    <VStack spacing="8" mt="16">
      <Heading>Not Started</Heading>
      {props.userId !== props.createdById ? (
        <Text>Waiting for creator to start the game</Text>
      ) : (
        <>
          {props.isGameFull ? (
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
                colorScheme={props.settings.mapSize === 11 ? "blue" : "gray"}
                onClick={() =>
                  props.onSettingsChange({ ...props.settings, mapSize: 11 })
                }
              >
                Small
              </Button>
              <Button
                variant="outline"
                size="sm"
                colorScheme={props.settings.mapSize === 21 ? "blue" : "gray"}
                onClick={() =>
                  props.onSettingsChange({ ...props.settings, mapSize: 21 })
                }
              >
                Medium
              </Button>
              <Button
                variant="outline"
                size="sm"
                colorScheme={props.settings.mapSize === 31 ? "blue" : "gray"}
                onClick={() =>
                  props.onSettingsChange({ ...props.settings, mapSize: 31 })
                }
              >
                Large
              </Button>
            </ButtonGroup>
          </VStack>
        </>
      )}

      {/* <VStack>
          <Text>{match?.players[0].slice(-5)}</Text>
          <Text fontStyle={!match?.players[1] ? "italic" : "normal"}>
            {match?.players[1] ? match?.players[1].slice(-5) : "Empty..."}
          </Text>
        </VStack> */}

      {props.userId === props.createdById && (
        <Button
          size="lg"
          colorScheme="blue"
          disabled={!props.isGameFull}
          onClick={() => {
            props.onStartGameClick()
          }}
        >
          {props.isGameFull ? "Start Game" : "Waiting for opponent..."}
        </Button>
      )}
    </VStack>
  )
}