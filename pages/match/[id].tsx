import { Container } from "@chakra-ui/react"
import { Match, MatchStatus, UnitType } from "@prisma/client"
import assert from "assert"
import Mousetrap from "mousetrap"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import useSWR, { mutate } from "swr"
import { MapContainer } from "../../components/map/MapContainer"
import { MapFog } from "../../components/map/MapFog"
import { MapHoveredHighlights } from "../../components/map/MapHoveredHighlights"
import { MapPlaceableTiles } from "../../components/map/MapPlaceableTiles"
import { MapTerrains } from "../../components/map/MapTerrains"
import { MapUnits } from "../../components/map/MapUnits"
import { UIConstellationView } from "../../components/ui/UIConstellationsView"
import { UILoadingIndicator } from "../../components/ui/UILoadingIndicator"
import { UILoggingView } from "../../components/ui/UILoggingView"
import { UIPostMatchView } from "../../components/ui/UIPostMatchView"
import { UIPreMatchView } from "../../components/ui/UIPreMatchView"
import { UIScoreView } from "../../components/ui/UIScoreView"
import { unitConstellations } from "../../gameLogic/unitConstellations"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../../models/UnitConstellation.model"
import { getCookie } from "../../services/CookieService"
import {
  checkForMatchUpdates,
  getMatch,
  makeMove,
  startMatch,
} from "../../services/GameManagerService"
import { MatchSettings } from "../../services/SettingsService"
import { MatchRich } from "../../types/Match"
import { TileRich } from "../../types/Tile"
import {
  buildTileLookupId,
  getAdjacentCoordinates,
  getAdjacentCoordinatesOfConstellation,
  getTileLookup,
} from "../../utils/coordinateUtils"

// @ts-ignore
const fetcher = (...args) => fetch(...args).then((res) => res.json())

function useMatch(id: string) {
  const { data, error, isLoading, mutate } = useSWR<MatchRich>(
    () => `/api/match/${id}`,
    fetcher,
    { refreshInterval: 5000 }
  )

  return {
    match: data,
    isLoading,
    isError: error,
    mutate,
  }
}

function useMatchUpdate(id: string, time: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/match/${id}/check=${time}`,
    fetcher
  )

  return {
    match: data,
    isLoading,
    isError: error,
    mutate,
  }
}

const MatchView = () => {
  const router = useRouter()
  const matchId = typeof router.query.id === "string" ? router.query.id : ""

  const { match, isLoading, isError, mutate: refetchMatch } = useMatch(matchId)

  // const { data: match } = useSWR("match", getMatch(matchId))
  // const [match, setMatch] = useState<MatchRich | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  let userId: string | null = null
  try {
    userId = getCookie("userId")
  } catch (e) {}

  const yourTurn = userId === match?.activePlayer?.userId

  const setStatus = (status: string) => {
    setStatusLog([
      new Date().toLocaleTimeString() + ": " + status,
      ...statusLog,
    ])
  }
  const [statusLog, setStatusLog] = useState<string[]>([])

  const [settings, setSettings] = useState<MatchSettings>({
    mapSize: 11,
  })

  const [selectedConstellation, setSelectedConstellation] = useState<
    Coordinate2D[] | null
  >(null)

  const hasUpdate = match?.updatedAt

  const tileLookup =
    useMemo(() => {
      return getTileLookup(match?.map?.tiles ?? [])
    }, [hasUpdate]) ?? []

  const terrainTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => tile.terrain && tile.visible)
    }, [hasUpdate]) ?? []

  const unitTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => tile.unit && tile.visible)
    }, [hasUpdate]) ?? []

  const fogTiles =
    useMemo(() => {
      return match?.map?.tiles.filter((tile) => !tile.visible)
    }, [hasUpdate]) ?? []

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
    }, [hasUpdate]) ?? []

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
    }, [hasUpdate]) ?? []

  const checkForUpdates = async (match: Match) => {
    setLoading(true)
    try {
      const updatedMatch = await checkForMatchUpdates(match.id, match.updatedAt)
      if (updatedMatch) {
        refetchMatch()
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!yourTurn) {
      console.log("unbinding")

      Mousetrap.unbind("1")
      Mousetrap.unbind("2")
      Mousetrap.unbind("3")
      Mousetrap.unbind("4")
      Mousetrap.unbind("5")
      Mousetrap.unbind("6")
      Mousetrap.unbind("esc")
    } else {
      console.log("binding")
      Mousetrap.bind("1", () => setSelectedConstellation(unitConstellations[0]))
      Mousetrap.bind("2", () => setSelectedConstellation(unitConstellations[1]))
      Mousetrap.bind("3", () => setSelectedConstellation(unitConstellations[2]))
      Mousetrap.bind("4", () => setSelectedConstellation(unitConstellations[3]))
      Mousetrap.bind("5", () => setSelectedConstellation(unitConstellations[4]))
      Mousetrap.bind("6", () => setSelectedConstellation(unitConstellations[5]))
      Mousetrap.bind("esc", () => setSelectedConstellation(null))
    }
  }, [yourTurn])

  // useEffect(() => {
  //   let interval: NodeJS.Timer
  //   if (match && !loading && !yourTurn) {
  //     interval = setInterval(() => {
  //       checkForUpdates(match)
  //     }, 1500)
  //   }
  //   return () => {
  //     clearInterval(interval)
  //   }
  // }, [match, loading])

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
    setLoading(true)
    try {
      const participantId = match.players.find(
        (player) => player.userId === userId
      )?.id

      assert(participantId)

      const updatedMatch = await makeMove(
        match.id,
        row,
        col,
        participantId,
        unitConstellation
      )
      refetchMatch()
      setSelectedConstellation(null)
      setStatus(`Placed unit on tile (${row}|${col})`)
    } catch (e: any) {
      setStatus(e.message)
      console.error(e.message)
    }
    setLoading(false)
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
    setLoading(true)
    try {
      const startedMatch = await startMatch(match.id, userId, settings.mapSize)
      refetchMatch()
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <Container height="100vh" color="white">
      {isPreMatch && (
        <UIPreMatchView
          pt="16"
          settings={settings}
          onSettingsChange={(settings) => setSettings(settings)}
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
            <MapHoveredHighlights
              player={match.activePlayer}
              hide={isFinished || !yourTurn}
              constellation={selectedConstellation}
              onTileClick={onTileClick}
            />

            <MapPlaceableTiles placeableCoordinates={placeableCoordinates} />
            <MapFog fogTiles={fogTiles} halfFogTiles={halfFogTiles} />
            <MapTerrains terrainTiles={terrainTiles} />
            <MapUnits unitTiles={unitTiles} players={match.players} />
          </MapContainer>
          <UIScoreView players={match.players} />
        </>
      )}
      {isFinished && <UIPostMatchView winner={match.winner} />}
      {isOngoing && (
        <UIConstellationView
          selectedConstellation={selectedConstellation}
          constellations={unitConstellations}
          readonly={!yourTurn}
          onSelect={(constellation) => setSelectedConstellation(constellation)}
        />
      )}
      <UILoggingView statusLog={statusLog} />
      <UILoadingIndicator loading={loading} />
    </Container>
  )
}

export default MatchView
