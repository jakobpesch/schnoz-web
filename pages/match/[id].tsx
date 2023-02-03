/* eslint-disable react-hooks/exhaustive-deps */
import { Container } from "@chakra-ui/react"
import { GameSettings, Match, MatchStatus, UnitType } from "@prisma/client"
import assert from "assert"
import Mousetrap from "mousetrap"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { MapContainer } from "../../components/map/MapContainer"
import { MapFog } from "../../components/map/MapFog"
import { MapHoveredHighlights } from "../../components/map/MapHoveredHighlights"
import { MapPlaceableTiles } from "../../components/map/MapPlaceableTiles"
import { MapRuleEvaluations } from "../../components/map/MapRuleEvaluations"
import { MapTerrains } from "../../components/map/MapTerrains"
import { MapUnits } from "../../components/map/MapUnits"
import { UIBonusPointsView } from "../../components/ui/UIBonusPointsView"
import { UICardsView as UICardsView } from "../../components/ui/UICardsView"
import { UILoadingIndicator } from "../../components/ui/UILoadingIndicator"
import { UILoggingView } from "../../components/ui/UILoggingView"
import { UIPostMatchView } from "../../components/ui/UIPostMatchView"
import { UIPreMatchView } from "../../components/ui/UIPreMatchView"
import { UIScoreView } from "../../components/ui/UIScoreView"
import { UITurnChangeIndicator } from "../../components/ui/UITurnChangeIndicator"
import { UITurnsView } from "../../components/ui/UITurnsView"
import { PlacementRuleName } from "../../gameLogic/PlacementRule"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../models/UnitConstellation.model"
import { getCookie } from "../../services/CookieService"
import {
  checkConditionsForUnitConstellationPlacement,
  createMap,
  makeMove,
  Special,
  expandBuildRadiusByOne,
  startMatch,
  updateSettings,
} from "../../services/GameManagerService"
import { MatchSettings } from "../../services/SettingsService"
import { fetcher } from "../../services/swrUtils"
import { MapWithTiles } from "../../types/Map"
import { MatchRich } from "../../types/Match"
import { TileWithUnits } from "../../types/Tile"
import {
  Card,
  decodeUnitConstellation,
} from "../../utils/constallationTransformer"
import {
  buildTileLookupId,
  coordinateIncludedIn,
  coordinatesAreEqual,
  getAdjacentCoordinates,
  getAdjacentCoordinatesOfConstellation,
  getNewlyRevealedTiles,
  getTileLookup,
} from "../../utils/coordinateUtils"
import { MatchCheckResponseData } from "../api/match/[id]/check"

function useMatch(id: string) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<MatchRich>(
    () => {
      if (!id) {
        throw new Error("No id")
      }
      return `/api/match/${id}/rich`
    },
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    match: data,
    isLoading,
    isError: error,
    isValidating,
    mutate,
  }
}

function useMatchUpdate(options: {
  match: Match | undefined
  shouldFetch?: boolean
  refreshInterval?: number
}) {
  const { match, shouldFetch = true, refreshInterval = 2500 } = options
  const { data, error, isLoading, isValidating } =
    useSWR<MatchCheckResponseData>(
      () => {
        if (!shouldFetch) {
          throw new Error()
        }
        if (!match) {
          throw new Error(
            "Cannot load match update. `useMatchUpdate` depends on `match`"
          )
        }
        return `/api/match/${match.id}/check?time=${match.updatedAt}`
      },
      fetcher,
      {
        refreshInterval: refreshInterval,
        refreshWhenHidden: true,
        dedupingInterval: 100,
      }
    )
  return {
    hasUpdate: data?.hasUpdate ?? false,
    isLoading,
    isValidating,
    isError: error,
  }
}

export function useUserId() {
  try {
    const userId = getCookie("userId")
    return userId
  } catch (e) {
    return null
  }
}

const MatchView = () => {
  const userId = useUserId()
  const router = useRouter()
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false)
  const [isChangingTurns, setIsChangingTurns] = useState(false)
  const [activatedSpecials, setActivatedSpecials] = useState<Special[]>([])

  const matchId = typeof router.query.id === "string" ? router.query.id : ""

  const {
    match,
    isLoading: isLoadingMatch,
    isError: isErrorMatch,
    mutate: updateMatch,
    isValidating,
  } = useMatch(matchId)

  const you = match?.players.find((player) => player.userId === userId)
  const yourTurn = userId === match?.activePlayer?.userId

  const {
    hasUpdate,
    isLoading: isLoadingUpdate,
    isError: isErrorUpdate,
  } = useMatchUpdate({
    match,
    shouldFetch:
      (!yourTurn && match?.status === MatchStatus.STARTED) ||
      (match?.status === MatchStatus.CREATED &&
        match.players.length !== match.maxPlayers) ||
      (match?.status === MatchStatus.CREATED && match.createdById !== userId),
  })

  useEffect(() => {
    updateMatch()
  }, [hasUpdate])

  const setStatus = (status: string) => {
    setStatusLog([
      new Date().toLocaleTimeString() + ": " + status,
      ...statusLog,
    ])
  }
  const [statusLog, setStatusLog] = useState<string[]>([])
  const [showRuleEvaluationHighlights, setShowRuleEvaluationHighlights] =
    useState<Coordinate2D[]>([])

  const [settings, setSettings] = useState<MatchSettings>({
    mapSize: 11,
  })

  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const cards =
    useMemo(() => {
      return match?.openCards?.map(decodeUnitConstellation)
    }, [match?.updatedAt]) ?? []

  const tileLookup =
    useMemo(() => {
      return getTileLookup(match?.map?.tiles ?? [])
    }, [match?.updatedAt]) ?? []

  const terrainTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => tile.terrain && tile.visible)
    }, [match?.updatedAt]) ?? []

  const unitTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => tile.unit && tile.visible)
    }, [match?.updatedAt]) ?? []

  const fogTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => !tile.visible)
    }, [match?.updatedAt]) ?? []

  const halfFogTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => {
        if (!tile.visible) {
          return false
        }
        const coordinate: Coordinate2D = [tile.row, tile.col]
        const adjacentCoordinates = getAdjacentCoordinates(coordinate)
        const hasHiddenAdjacentTile = adjacentCoordinates.some(
          (adjacentCoordinate) => {
            const tile = tileLookup[buildTileLookupId(adjacentCoordinate)]
            if (!tile) {
              return false
            }
            return !tile.visible
          }
        )
        return tile.visible && hasHiddenAdjacentTile
      })
    }, [match?.updatedAt]) ?? []

  const placeableCoordinates =
    useMemo(() => {
      if (!yourTurn || !match || !match.map) {
        return []
      }

      if (
        selectedCard?.coordinates.length === 1 &&
        coordinatesAreEqual(selectedCard.coordinates[0], [0, 0])
      ) {
        const visibleAndFreeTiles: Coordinate2D[] = Object.values(tileLookup)
          .filter((tile) => tile.visible && !tile.unit && !tile.terrain)
          .map((tile) => [tile.row, tile.col])
        return visibleAndFreeTiles
      }

      const alliedTiles =
        match.map.tiles.filter(
          (tile) =>
            tile.unit?.ownerId === match.activePlayer?.id ||
            tile?.unit?.type === UnitType.MAIN_BUILDING
        ) ?? []

      let placeableCoordiantes = getAdjacentCoordinatesOfConstellation(
        alliedTiles.map((tile) => [tile.row, tile.col])
      ).filter((coordinate) => {
        const hasTerrain =
          tileLookup[buildTileLookupId(coordinate)]?.terrain ?? false
        const hasUnit = tileLookup[buildTileLookupId(coordinate)]?.unit ?? false
        return !hasTerrain && !hasUnit
      })

      const usesSpecial = activatedSpecials.find((special) => {
        assert(match.activePlayer)
        return (
          special.type === "EXPAND_BUILD_RADIUS_BY_1" &&
          match.activePlayer.bonusPoints + (selectedCard?.value ?? 0) >=
            special.cost
        )
      })
      if (usesSpecial) {
        placeableCoordiantes = [
          ...placeableCoordiantes,
          ...getAdjacentCoordinatesOfConstellation(placeableCoordiantes).filter(
            (coordinate) => {
              const hasTerrain =
                tileLookup[buildTileLookupId(coordinate)]?.terrain ?? false
              const hasUnit =
                tileLookup[buildTileLookupId(coordinate)]?.unit ?? false
              return !hasTerrain && !hasUnit
            }
          ),
        ]
      }
      return placeableCoordiantes
    }, [match?.updatedAt, selectedCard, activatedSpecials]) ?? []

  useEffect(() => {
    match?.openCards.forEach((unitConstellation, index) => {
      const hotkey = index + 1 + ""
      Mousetrap.unbind(hotkey)
      if (yourTurn) {
        Mousetrap.bind(hotkey, () =>
          setSelectedCard(decodeUnitConstellation(unitConstellation))
        )
      }
    })
    Mousetrap.unbind("esc")
    if (yourTurn) {
      Mousetrap.bind("esc", () => setSelectedCard(null))
    }
  }, [match?.updatedAt])

  if (!userId || !match) {
    return null
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

      updateMatch(
        makeMove(
          match.id,
          row,
          col,
          participantId,
          unitConstellation,
          ignoredRules,
          ignoredRules.includes("ADJACENT_TO_ALLY")
            ? activatedSpecials.filter(
                (special) => special.type !== "EXPAND_BUILD_RADIUS_BY_1"
              )
            : activatedSpecials
        ),
        {
          optimisticData,
          populateCache: true,
          rollbackOnError: true,
          revalidate: true,
        }
      ).then(() => setIsUpdatingMatch(false))

      setSelectedCard(null)
      setActivatedSpecials([])
      setStatus(`Placed unit on tile (${row}|${col})`)
    } catch (e: any) {
      setStatus(e.message)
      console.error(e.message)
    }
  }

  const isPreMatch = match.status === MatchStatus.CREATED

  const wasStarted =
    match.status === MatchStatus.STARTED ||
    match.status === MatchStatus.FINISHED

  const isOngoing = match.status === MatchStatus.STARTED

  const isFinished = match.status === MatchStatus.FINISHED

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
      updateMatch().finally(() => setIsUpdatingMatch(false))
    } catch (e) {
      console.error(e)
    }
  }

  const handleSettingsChange = async (settings: {
    mapSize?: GameSettings["mapSize"]
    rules?: GameSettings["rules"]
    maxTurns?: GameSettings["maxTurns"]
    waterRatio?: GameSettings["waterRatio"]
    treeRatio?: GameSettings["treeRatio"]
    stoneRatio?: GameSettings["stoneRatio"]
  }) => {
    if (!userId || !match.gameSettings) {
      return
    }
    try {
      const gameSettings = { ...match.gameSettings }
      if (settings.mapSize) {
        gameSettings.mapSize = settings.mapSize
      }
      if (settings.rules) {
        gameSettings.rules = settings.rules
      }
      if (settings.maxTurns != null) {
        gameSettings.maxTurns = settings.maxTurns
      }
      if (settings.waterRatio != null) {
        gameSettings.waterRatio = settings.waterRatio
      }
      if (settings.treeRatio != null) {
        gameSettings.treeRatio = settings.treeRatio
      }
      if (settings.stoneRatio != null) {
        gameSettings.stoneRatio = settings.stoneRatio
      }
      const optimisticData: MatchRich = {
        ...match,
        gameSettings,
        updatedAt: new Date(),
      }
      updateMatch(
        updateSettings({
          matchId,
          userId,
          mapSize: gameSettings.mapSize,
          rules: gameSettings.rules,
          maxTurns: gameSettings.maxTurns,
          waterRatio: gameSettings.waterRatio,
          stoneRatio: gameSettings.stoneRatio,
          treeRatio: gameSettings.treeRatio,
        }),
        {
          optimisticData,
          populateCache: true,
          rollbackOnError: true,
          revalidate: true,
        }
      ).finally(() => setIsUpdatingMatch(false))

      setStatus("Updated Settings")
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  return (
    <Container height="100vh" color="white">
      {isPreMatch && (
        <UIPreMatchView
          py="16"
          isLoading={isUpdatingMatch || isValidating}
          settings={match.gameSettings}
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
            {isOngoing && !isLoadingMatch && !isUpdatingMatch && (
              <MapPlaceableTiles placeableCoordinates={placeableCoordinates} />
            )}

            <MapUnits unitTiles={unitTiles} players={match.players} />
            {showRuleEvaluationHighlights && (
              <MapRuleEvaluations coordinates={showRuleEvaluationHighlights} />
            )}
            <MapTerrains terrainTiles={terrainTiles} />
            <MapFog fogTiles={fogTiles} halfFogTiles={halfFogTiles} />
            {!isLoadingMatch && !isUpdatingMatch && !isChangingTurns && (
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
            )}
          </MapContainer>

          <UIScoreView
            players={match.players}
            map={match.map}
            rules={match.gameSettings?.rules ?? []}
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
        loading={isLoadingMatch || isLoadingUpdate || isUpdatingMatch}
      />
    </Container>
  )
}

export default MatchView
