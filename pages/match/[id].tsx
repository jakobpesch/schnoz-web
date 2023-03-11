/* eslint-disable react-hooks/exhaustive-deps */
import {
  Box,
  Button,
  Center,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { UnitType } from "@prisma/client"
import assert from "assert"
import Mousetrap from "mousetrap"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { MapContainer } from "../../components/map/MapContainer"
import { MapFog } from "../../components/map/MapFog"
import { MapHoveredHighlights } from "../../components/map/MapHoveredHighlights"
import { MapPlaceableTiles } from "../../components/map/MapPlaceableTiles"
import { MapRuleEvaluations } from "../../components/map/MapRuleEvaluations"
import { MapTerrains } from "../../components/map/MapTerrains"
import { MapUnits } from "../../components/map/MapUnits"
import { UICardsView } from "../../components/ui/UICardsView"
import { UILoadingIndicator } from "../../components/ui/UILoadingIndicator"
import { UILoggingView } from "../../components/ui/UILoggingView"
import { UIPostMatchView } from "../../components/ui/UIPostMatchView"
import { UIPreMatchView } from "../../components/ui/UIPreMatchView"
import { UIScoreView } from "../../components/ui/UIScoreView"
import { UITurnChangeIndicator } from "../../components/ui/UITurnChangeIndicator"
import { UITurnsView } from "../../components/ui/UITurnsView"
import { PlacementRuleName } from "../../gameLogic/PlacementRule"
import { useCards } from "../../hooks/useCards"
import { useMatch } from "../../hooks/useMatch"
import { useMatchStatus } from "../../hooks/useMatchStatus"
import { usePlaceableCoordinates } from "../../hooks/usePlaceableCoordinates"
import { useTiles } from "../../hooks/useTiles"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../models/UnitConstellation.model"
import { getCookie } from "../../services/CookieService"
import {
  checkConditionsForUnitConstellationPlacement,
  createMap,
  expandBuildRadiusByOne,
  Special,
  startMatch,
} from "../../services/GameManagerService"
import { updateGameSettings } from "../../services/SettingsService"
import {
  socketApi,
  UpdateGameSettingsPayload,
} from "../../services/SocketService"
import { MapWithTiles } from "../../types/Map"
import { MatchRich } from "../../types/Match"
import { TileWithUnits } from "../../types/Tile"
import {
  Card,
  decodeUnitConstellation,
} from "../../utils/constallationTransformer"
import {
  coordinateIncludedIn,
  coordinatesAreEqual,
  getNewlyRevealedTiles,
} from "../../utils/coordinateUtils"

export function useUserId() {
  try {
    return getCookie("userId")
  } catch (e) {
    return null
  }
}

const MatchView = () => {
  const router = useRouter()
  const userId = useUserId()

  const matchId = typeof router.query.id === "string" ? router.query.id : ""

  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false)
  const [isChangingTurns, setIsChangingTurns] = useState(false)
  const [activatedSpecials, setActivatedSpecials] = useState<Special[]>([])

  const { match, gameSettings } = useMatch(userId ?? "", matchId)
  const you = match?.players.find((player) => player.userId === userId)
  const yourTurn = userId === match?.activePlayer?.userId

  const setStatus = (status: string) => {
    setStatusLog([
      new Date().toLocaleTimeString() + ": " + status,
      ...statusLog,
    ])
  }
  const [statusLog, setStatusLog] = useState<string[]>([])

  const [showRuleEvaluationHighlights, setShowRuleEvaluationHighlights] =
    useState<Coordinate2D[]>([])

  const { cards, selectedCard, setSelectedCard } = useCards(match, yourTurn)
  const { tileLookup, terrainTiles, unitTiles, fogTiles, halfFogTiles } =
    useTiles(match)
  const { placeableCoordinates } = usePlaceableCoordinates(
    match,
    yourTurn,
    selectedCard,
    activatedSpecials
  )

  if (!userId || !match) {
    return null
  }

  if (!socketApi.isConnected) {
    return (
      <Center height="100vh">
        <VStack>
          <Heading>Disconnected</Heading>
          <Text>You were disconnected by the server.</Text>
          <Button
            isLoading={socketApi.isConnecting}
            onClick={() => {
              socketApi.connectToMatch(userId, matchId)
            }}
          >
            Reconnect
          </Button>
        </VStack>
      </Center>
    )
  }

  const isMatchFull =
    match.players?.filter((player) => player !== null).length === 2

  const onTileClick = async (
    row: number,
    col: number,
    rotatedClockwise: IUnitConstellation["rotatedClockwise"],
    mirrored: IUnitConstellation["mirrored"]
  ) => {
    if (isUpdatingMatch) {
      return
    }

    if (!userId) {
      return
    }

    if (!selectedCard) {
      return
    }

    const unitConstellation: IUnitConstellation = {
      coordinates: selectedCard.coordinates,
      value: selectedCard.value,
      rotatedClockwise,
      mirrored,
    }

    try {
      const participantId = match.players.find(
        (player) => player.userId === userId
      )?.id

      assert(participantId)
      assert(match.map)

      const ignoredRules: PlacementRuleName[] =
        unitConstellation.coordinates.length === 1 &&
        coordinatesAreEqual(unitConstellation.coordinates[0], [0, 0])
          ? ["ADJACENT_TO_ALLY"]
          : []

      const { translatedCoordinates, error } =
        checkConditionsForUnitConstellationPlacement(
          [row, col],
          unitConstellation,
          match,
          match.map,
          tileLookup,
          ignoredRules,
          participantId,
          activatedSpecials
        )

      if (error) {
        setStatus(error.message)
        return
      }
      const mapClone = JSON.parse(JSON.stringify(match.map)) as MapWithTiles

      translatedCoordinates.forEach((coordinate, index) => {
        const tile = mapClone.tiles.find((tile) =>
          coordinatesAreEqual([tile.row, tile.col], coordinate)
        )
        if (!tile) {
          return
        }
        tile.unit = {
          id: "pending-unit-" + index,
          row: tile.row,
          col: tile.col,
          mapId: tile.mapId,
          ownerId: participantId,
          type: UnitType.UNIT,
        }
      })

      const { tiles: revealedTiles, error: revealedError } =
        getNewlyRevealedTiles(tileLookup, translatedCoordinates)

      if (revealedError) {
        setStatus(revealedError.message)
        return
      }

      const optimisticData: MatchRich = {
        ...match,
        turn: match.turn + 1,
        map: {
          ...mapClone,
          tiles: mapClone.tiles.map((tile, index) => {
            const updatedTile: TileWithUnits = { ...tile }
            if (
              coordinateIncludedIn(
                revealedTiles.map((tile) => [tile.row, tile.col]),
                [updatedTile.row, updatedTile.col]
              )
            ) {
              updatedTile.visible = true
            }
            if (
              coordinateIncludedIn(translatedCoordinates, [
                updatedTile.row,
                updatedTile.col,
              ])
            ) {
              updatedTile.unit = {
                id: "pending-unit-" + index,
                row: tile.row,
                col: tile.col,
                mapId: tile.mapId,
                ownerId: participantId,
                type: UnitType.UNIT,
              }
            }

            return updatedTile
          }),
        },
        updatedAt: new Date(),
      }
      setIsUpdatingMatch(true)

      // updateMatch(
      //   makeMove(
      //     match.id,
      //     row,
      //     col,
      //     participantId,
      //     unitConstellation,
      //     ignoredRules,
      //     ignoredRules.includes("ADJACENT_TO_ALLY")
      //       ? activatedSpecials.filter(
      //           (special) => special.type !== "EXPAND_BUILD_RADIUS_BY_1"
      //         )
      //       : activatedSpecials
      //   ),
      //   {
      //     optimisticData,
      //     populateCache: true,
      //     rollbackOnError: true,
      //     revalidate: true,
      //   }
      // ).then(() => setIsUpdatingMatch(false))

      setSelectedCard(null)
      setActivatedSpecials([])
      setStatus(`Placed unit on tile (${row}|${col})`)
    } catch (e: any) {
      setStatus(e.message)
      console.error(e.message)
    }
  }

  const onStartGameClick = async () => {
    if (!userId) {
      return
    }

    try {
      setIsUpdatingMatch(true)
      if (!match.map) {
        await createMap(match.id, userId)
      }
      await startMatch(match.id, userId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSettingsChange = async (
    settings: Omit<UpdateGameSettingsPayload, "matchId">
  ) => {
    try {
      await updateGameSettings(settings)
      setStatus("Updated Settings")
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  const { isPreMatch, wasStarted, isOngoing, isFinished } = useMatchStatus(
    match.status
  )

  return (
    <Container height="100vh" color="white">
      {isPreMatch && (
        <UIPreMatchView
          py="16"
          isLoading={isUpdatingMatch /*|| isValidating*/}
          settings={gameSettings ?? null}
          onSettingsChange={handleSettingsChange}
          onStartGameClick={onStartGameClick}
          userId={userId}
          createdById={match.createdById}
          isGameFull={isMatchFull}
          matchId={match.id}
        />
      )}
      {wasStarted && (
        <>
          <MapContainer
            id="map-container"
            match={match}
            cursor={selectedCard ? "none" : "default"}
          >
            {isOngoing && /*!isLoadingMatch && */ !isUpdatingMatch && (
              <MapPlaceableTiles placeableCoordinates={placeableCoordinates} />
            )}

            <MapUnits unitTiles={unitTiles} players={match.players} />
            {showRuleEvaluationHighlights && (
              <MapRuleEvaluations coordinates={showRuleEvaluationHighlights} />
            )}
            <MapTerrains terrainTiles={terrainTiles} />
            <MapFog fogTiles={fogTiles} halfFogTiles={halfFogTiles} />
            {
              /*!isLoadingMatch && */ !isUpdatingMatch && !isChangingTurns && (
                <MapHoveredHighlights
                  player={match.activePlayer}
                  hide={isFinished || !yourTurn}
                  specials={[expandBuildRadiusByOne]}
                  activeSpecials={activatedSpecials}
                  setSpecial={(specialType, active) => {
                    if (active) {
                      setActivatedSpecials([expandBuildRadiusByOne])
                    } else {
                      setActivatedSpecials([])
                    }
                  }}
                  card={selectedCard}
                  onTileClick={onTileClick}
                />
              )
            }
          </MapContainer>

          <UIScoreView
            players={match.players}
            map={match.map}
            rules={gameSettings?.rules ?? []}
            onRuleHover={(coordinates) => {
              setShowRuleEvaluationHighlights(coordinates)
            }}
          />
        </>
      )}
      {isFinished && <UIPostMatchView winner={match.winner} />}
      {isOngoing && (
        <>
          <UITurnsView match={match} />
          {/* {you?.bonusPoints != null && (
            <UIBonusPointsView bonusPoints={you.bonusPoints} />
          )} */}
          <UICardsView
            selectedCard={selectedCard}
            cards={cards}
            readonly={!yourTurn}
            onSelect={(card) => {
              const insufficientBonusPoints =
                (match.activePlayer?.bonusPoints ?? 0) + (card.value ?? 0) <
                activatedSpecials.reduce((a, s) => a + s.cost, 0)

              const isSinglePiece =
                card.coordinates.length === 1 &&
                coordinatesAreEqual(card.coordinates[0], [0, 0])

              if (isSinglePiece || insufficientBonusPoints) {
                setActivatedSpecials([])
              }
              setSelectedCard(card)
            }}
          />

          {match.activePlayer && (
            <UITurnChangeIndicator
              activePlayer={match.activePlayer}
              onChangingTurnsStart={() => {
                setIsChangingTurns(true)
              }}
              onChangingTurnsEnd={() => {
                setIsChangingTurns(false)
              }}
            />
          )}
        </>
      )}
      <UILoggingView statusLog={statusLog} />
      <UILoadingIndicator
        loading={/*!isLoadingMatch ||  isLoadingUpdate || */ isUpdatingMatch}
      />
    </Container>
  )
}

export default MatchView
