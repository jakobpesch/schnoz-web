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
import { UIConstellationView } from "../../components/ui/UIConstellationsView"
import { UILoadingIndicator } from "../../components/ui/UILoadingIndicator"
import { UILoggingView } from "../../components/ui/UILoggingView"
import { UIPostMatchView } from "../../components/ui/UIPostMatchView"
import { UIPreMatchView } from "../../components/ui/UIPreMatchView"
import { UIScoreView } from "../../components/ui/UIScoreView"
import { UITurnChangeIndicator } from "../../components/ui/UITurnChangeIndicator"
import { UITurnsView } from "../../components/ui/UITurnsView"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../models/UnitConstellation.model"
import { getCookie } from "../../services/CookieService"
import {
  checkConditionsForUnitConstellationPlacement,
  makeMove,
  startMatch,
  updateSettings,
} from "../../services/GameManagerService"
import { MatchSettings } from "../../services/SettingsService"
import { MapWithTiles } from "../../types/Map"
import { MatchRich } from "../../types/Match"
import { TileWithUnits } from "../../types/Tile"
import { decodeUnitConstellation } from "../../utils/constallationTransformer"
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

// @ts-ignore
const fetcher = (...args) => fetch(...args).then((res) => res.json())

function useMatch(id: string) {
  const { data, error, isLoading, mutate } = useSWR<MatchRich>(
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
    mutate,
  }
}

function useMatchUpdate(options: {
  match: Match | undefined
  shouldFetch?: boolean
  refreshInterval?: number
}) {
  const { match, shouldFetch = true, refreshInterval = 1000 } = options
  const { data, error, isLoading } = useSWR<MatchCheckResponseData>(
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

  const matchId = typeof router.query.id === "string" ? router.query.id : ""

  const {
    match,
    isLoading: isLoadingMatch,
    isError: isErrorMatch,
    mutate: updateMatch,
  } = useMatch(matchId)

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

  const [selectedConstellation, setSelectedConstellation] = useState<
    Coordinate2D[] | null
  >(null)

  const unitConstellations =
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

      const alliedTiles =
        match.map.tiles.filter(
          (tile) =>
            tile.unit?.ownerId === match.activePlayer?.id ||
            tile?.unit?.type === UnitType.MAIN_BUILDING
        ) ?? []

      return getAdjacentCoordinatesOfConstellation(
        alliedTiles.map((tile) => [tile.row, tile.col])
      ).filter((coordinate) => {
        const hasTerrain =
          tileLookup[buildTileLookupId(coordinate)]?.terrain ?? false
        const hasUnit = tileLookup[buildTileLookupId(coordinate)]?.unit ?? false
        return !hasTerrain && !hasUnit
      })
    }, [match?.updatedAt]) ?? []

  useEffect(() => {
    match?.openCards.forEach((unitConstellation, index) => {
      const hotkey = index + 1 + ""
      Mousetrap.unbind(hotkey)
      if (yourTurn) {
        Mousetrap.bind(hotkey, () =>
          setSelectedConstellation(decodeUnitConstellation(unitConstellation))
        )
      }
    })
    Mousetrap.unbind("esc")
    if (yourTurn) {
      Mousetrap.bind("esc", () => setSelectedConstellation(null))
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
    rotatedClockwise: IUnitConstellation["rotatedClockwise"]
  ) => {
    if (isUpdatingMatch) {
      return
    }

    if (!userId) {
      return
    }

    if (!selectedConstellation) {
      return
    }

    const unitConstellation: IUnitConstellation = {
      coordinates: selectedConstellation,
      rotatedClockwise,
    }

    try {
      const participantId = match.players.find(
        (player) => player.userId === userId
      )?.id

      assert(participantId)
      assert(match.map)

      const { translatedCoordinates, error } =
        checkConditionsForUnitConstellationPlacement(
          [row, col],
          unitConstellation,
          match,
          match.map,
          tileLookup,
          participantId
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
          tileId: tile.id,
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
                tileId: tile.id,
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
        makeMove(match.id, row, col, participantId, unitConstellation),
        {
          optimisticData,
          populateCache: true,
          rollbackOnError: true,
          revalidate: true,
        }
      ).then(() => setIsUpdatingMatch(false))

      setSelectedConstellation(null)
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
      const startedMatch = await startMatch(match.id, userId)
      updateMatch()
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
      ).then(() => setIsUpdatingMatch(false))

      setStatus("Updated Settings")
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  return (
    <Container height="100vh" color="white">
      {isPreMatch && (
        <UIPreMatchView
          pt="16"
          settings={match.gameSettings}
          onSettingsChange={handleSettingsChange}
          onStartGameClick={onStartGameClick}
          userId={userId}
          createdById={match.createdById}
          isGameFull={isMatchFull}
        />
      )}
      {wasStarted && (
        <>
          <MapContainer
            id="map-container"
            match={match}
            cursor={selectedConstellation ? "none" : "default"}
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
                constellation={selectedConstellation}
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
          <UIConstellationView
            selectedConstellation={selectedConstellation}
            constellations={unitConstellations}
            readonly={!yourTurn}
            onSelect={(constellation) =>
              setSelectedConstellation(constellation)
            }
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
