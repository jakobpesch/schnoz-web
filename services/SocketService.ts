import { GameSettings, Map, Match, Participant, Unit } from "@prisma/client"
import { io, Socket } from "socket.io-client"
import { PlacementRuleName } from "../gameLogic/PlacementRule"
import {
  Coordinate2D,
  IUnitConstellation,
} from "../models/UnitConstellation.model"
import { ClientEvent } from "../shared-server/client-event.enum"
import { ServerEvent } from "../shared-server/server-event.enum"
import { MatchRich } from "../types/Match"
import { TileWithUnit } from "../types/Tile"
import { Special } from "./GameManagerService"

export type UpdateGameSettingsPayload = Partial<Omit<GameSettings, "id">>

export class SocketIOApi {
  private socket: Socket | undefined

  private _isConnecting = false
  public get isConnecting() {
    return this._isConnecting
  }
  public get isConnected() {
    return !!this.socket?.connected
  }

  private callbacks: {
    setMatch?: (match: Match) => void
    setGameSettings?: (gameSettings: GameSettings) => void
    setMap?: (map: Map) => void
    setTilesWithUnits?: (tilesWithUnits: TileWithUnit[]) => void
    setUpdatedTilesWithUnits?: (updatedTilesWithUnits: TileWithUnit[]) => void
    setUnits?: (units: Unit[]) => void
    setPlayers?: (players: Participant[]) => void
    setOpponentsHoveredTiles?: (hoveringTiles: Coordinate2D[] | null) => void
    setLastSynced?: (lastSynced: string) => void
  } = {}

  public setCallbacks = (callbacks: typeof this.callbacks) => {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  public connectToMatch = (userId: string, matchId: string) => {
    this._isConnecting = true
    this.socket = io("http://localhost:3000", {
      query: { userId, matchId },
      autoConnect: false,
    })
    this.socket.on(
      ServerEvent.PLAYER_CONNECTED_TO_MATCH,
      (data: Parameters<typeof this.onPlayerConnectedToMatch>[number]) => {
        this.onPlayerConnectedToMatch(data)
      }
    )
    this.socket.on(
      ServerEvent.UPDATED_GAME_SETTINGS,
      (data: Parameters<typeof this.onUpdatedGameSettings>[number]) => {
        this.onUpdatedGameSettings(data)
      }
    )
    this.socket.on(
      ServerEvent.HOVERED,
      (data: Parameters<typeof this.onHovered>[number]) => {
        this.onHovered(data)
      }
    )
    this.socket.on(
      ServerEvent.MADE_MOVE,
      (data: Parameters<typeof this.onMadeMove>[number]) => {
        this.onMadeMove(data)
      }
    )
    this.socket.on(ServerEvent.DISCONNECTED_FROM_MATCH, () => {
      console.log("connectToMatch:disconnectedFromMatch")
    })

    this.socket.on("connect_error", (error: Error) => {
      console.error("connect error", error)
      throw error
    })

    this.socket.connect()
  }

  private onPlayerConnectedToMatch = (payload: {
    match: Match
    gameSettings?: GameSettings
    map?: Map
    tilesWithUnits?: TileWithUnit[]
    players?: Participant[]
  }) => {
    this.callbacks.setMatch?.(payload.match)
    if (payload.gameSettings) {
      this.callbacks.setGameSettings?.(payload.gameSettings)
    }
    if (payload.players) {
      this.callbacks.setPlayers?.(payload.players)
    }
    if (payload.tilesWithUnits) {
      this.callbacks.setTilesWithUnits?.(payload.tilesWithUnits)
    }
    if (payload.map) {
      this.callbacks.setMap?.(payload.map)
    }
  }

  private onUpdatedGameSettings = (gameSettings: GameSettings) => {
    this.callbacks.setGameSettings?.(gameSettings)
  }

  private onHovered = (hoveredCoordinates: Coordinate2D[] | null) => {
    this.callbacks.setOpponentsHoveredTiles?.(hoveredCoordinates)
  }

  private onMadeMove = (payload: {
    updatedMatch: MatchRich
    updatedTilesWithUnits: TileWithUnit[]
    updatedPlayers: Participant[]
  }) => {
    this.callbacks.setMatch?.(payload.updatedMatch)
    this.callbacks.setUpdatedTilesWithUnits?.(payload.updatedTilesWithUnits)
    this.callbacks.setPlayers?.(payload.updatedPlayers)
  }

  public sendRequest = async (request: { event: string; data: any }) => {
    try {
      if (!this.socket?.connected) {
        console.error(new Error("Socket not connected"))
        return
      }

      this.socket.emit(request.event, request.data)
    } catch (error) {
      return error
    }
  }

  public async disconnect() {
    console.log("disconnect")

    this.socket?.disconnect()
  }

  async updateGameSettings(
    settings: Omit<UpdateGameSettingsPayload, "matchId">
  ) {
    const gameSettings: UpdateGameSettingsPayload = {}
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

    await socketApi.sendRequest({
      event: ClientEvent.UPDATE_GAME_SETTINGS,
      data: gameSettings,
    })
  }

  async makeMove(payload: {
    matchId: string
    row: number
    col: number
    participantId: string
    unitConstellation: IUnitConstellation
    ignoredRules?: PlacementRuleName[]
    specials?: Special[]
  }) {
    await socketApi.sendRequest({
      event: ClientEvent.MAKE_MOVE,
      data: payload,
    })
  }

  async sendHoveredCoordinates(hoveredCoordinates: Coordinate2D[] | null) {
    await socketApi.sendRequest({
      event: ClientEvent.HOVER,
      data: hoveredCoordinates,
    })
  }
}

export const socketApi = new SocketIOApi()
