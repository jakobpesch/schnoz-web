import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Grid,
  GridItem,
  Heading,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  StackProps,
  Text,
  VStack,
} from "@chakra-ui/react"
import { GameSettings, Rule, Terrain } from "@prisma/client"
import { Fragment, useEffect, useState } from "react"

interface UIPreMatchViewProps extends StackProps {
  settings: GameSettings | null
  userId: string
  createdById: string
  isGameFull: boolean
  isLoading: boolean
  onSettingsChange: (settings: {
    mapSize?: GameSettings["mapSize"]
    rules?: GameSettings["rules"]
    maxTurns?: GameSettings["maxTurns"]
  }) => void
  onStartGameClick: () => void
}

export const UIPreMatchView = (props: UIPreMatchViewProps) => {
  const {
    settings,
    userId,
    createdById,
    isGameFull,
    isLoading,
    onSettingsChange,
    onStartGameClick,
    ...stackProps
  } = props
  const [sliderValueWater, setSliderValueWater] = useState(
    settings?.waterRatio ?? 0
  )
  const [sliderValueStone, setSliderValueStone] = useState(
    settings?.stoneRatio ?? 0
  )
  const [sliderValueTree, setSliderValueTree] = useState(
    settings?.treeRatio ?? 0
  )

  useEffect(() => {
    setSliderValueWater(settings?.waterRatio ?? 0)
    setSliderValueStone(settings?.stoneRatio ?? 0)
    setSliderValueTree(settings?.treeRatio ?? 0)
  }, [settings])

  if (!settings) {
    return <Box>No Settings</Box>
  }

  const isHost = userId === createdById
  return (
    <VStack spacing="8" maxWidth="sm" {...stackProps}>
      <Heading>Not Started</Heading>
      {!isHost ? (
        <Text>Waiting for creator to start the game</Text>
      ) : isGameFull ? (
        <Text>Game is full. Ready to start game.</Text>
      ) : (
        <Text color="gray.300">Waiting for other player to join</Text>
      )}
      <Stack width="full" spacing="8">
        <Stack width="full">
          <Text fontWeight="bold">Map size</Text>
          <ButtonGroup isAttached>
            <Button
              variant="outline"
              size="sm"
              disabled={!isHost}
              _disabled={{ opacity: 1, cursor: "default" }}
              colorScheme={settings.mapSize === 11 ? "blue" : "gray"}
              onClick={() => onSettingsChange({ mapSize: 11 })}
            >
              Small
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isHost}
              _disabled={{ opacity: 1, cursor: "default" }}
              colorScheme={settings.mapSize === 21 ? "blue" : "gray"}
              onClick={() => onSettingsChange({ mapSize: 21 })}
            >
              Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isHost}
              _disabled={{ opacity: 1, cursor: "default" }}
              colorScheme={settings.mapSize === 31 ? "blue" : "gray"}
              onClick={() => onSettingsChange({ mapSize: 31 })}
            >
              Large
            </Button>
          </ButtonGroup>
        </Stack>
        <Stack width="full">
          <Text fontWeight="bold">Game length</Text>
          <ButtonGroup isAttached>
            <Button
              variant="outline"
              size="sm"
              disabled={!isHost}
              _disabled={{ opacity: 1, cursor: "default" }}
              colorScheme={settings.maxTurns === 6 ? "blue" : "gray"}
              onClick={() => onSettingsChange({ maxTurns: 6 })}
            >
              Very Short
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isHost}
              _disabled={{ opacity: 1, cursor: "default" }}
              colorScheme={settings.maxTurns === 12 ? "blue" : "gray"}
              onClick={() => onSettingsChange({ maxTurns: 12 })}
            >
              Short
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isHost}
              _disabled={{ opacity: 1, cursor: "default" }}
              colorScheme={settings.maxTurns === 24 ? "blue" : "gray"}
              onClick={() => onSettingsChange({ maxTurns: 24 })}
            >
              Standard
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isHost}
              _disabled={{ opacity: 1, cursor: "default" }}
              colorScheme={settings.maxTurns === 36 ? "blue" : "gray"}
              onClick={() => onSettingsChange({ maxTurns: 36 })}
            >
              Long
            </Button>
          </ButtonGroup>
        </Stack>
        <Stack width="full">
          <Text fontWeight="bold">Rules</Text>
          <CheckboxGroup>
            {Object.values(Rule).map((rule) => (
              <Checkbox
                key={rule}
                isChecked={settings.rules.includes(rule)}
                readOnly={!isHost}
                onChange={(e) => {
                  const isChecked = e.target.checked
                  if (isChecked) {
                    onSettingsChange({ rules: [...settings.rules, rule] })
                  } else {
                    onSettingsChange({
                      rules: [...settings.rules].filter((r) => r !== rule),
                    })
                  }
                }}
              >
                {rule}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </Stack>
      </Stack>
      <Stack width="full">
        <Text fontWeight="bold" pb="4">
          Terrain
        </Text>
        <Grid templateColumns="repeat(5, 1fr)" alignItems="center">
          {Object.values(Terrain).map((terrain) => {
            const ratio =
              terrain === "WATER"
                ? "waterRatio"
                : terrain === "STONE"
                ? "stoneRatio"
                : "treeRatio"
            const setter =
              terrain === "WATER"
                ? setSliderValueWater
                : terrain === "STONE"
                ? setSliderValueStone
                : setSliderValueTree
            const state =
              terrain === "WATER"
                ? sliderValueWater
                : terrain === "STONE"
                ? sliderValueStone
                : sliderValueTree
            return (
              <Fragment key={terrain}>
                <GridItem>
                  <Text>{terrain}</Text>
                </GridItem>
                <GridItem colSpan={4} alignSelf="center">
                  <Slider
                    id="slider"
                    value={state}
                    min={0}
                    max={10}
                    isReadOnly={!isHost}
                    colorScheme="teal"
                    onChange={(v) => setter(v)}
                    onChangeEnd={(v) => {
                      onSettingsChange({ [ratio]: v })
                      setter(v)
                    }}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </GridItem>
              </Fragment>
            )
          })}
        </Grid>
      </Stack>

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
          disabled={!isGameFull || isLoading}
          isLoading={isLoading}
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
