import { GameSettings, Match } from "@prisma/client"
import { io } from "socket.io-client"
import { Socket } from "socket.io-client"
import { Coordinate2D } from "../models/UnitConstellation.model"
import { ClientEvent } from "../shared-server/client-event.enum"
import { ServerEvent } from "../shared-server/server-event.enum"
import { MatchRich } from "../types/Match"

export type UpdateGameSettingsPayload = Partial<Omit<GameSettings, "id">>

export class SocketIOApi {
  private socket: Socket | undefined
  private match: MatchRich | undefined
  public lastUpdatedAt: string = ""

  get Match() {
    return this.match
  }
  private _isConnecting = false
  public get isConnecting() {
    return this._isConnecting
  }
  public get isConnected() {
    return !!this.socket?.connected
  }

  private callbacks: {
    setMatch?: (match: MatchRich) => void
    setGameSettings?: (gameSettings: GameSettings) => void
    setOpponentsHoveredTiles?: (hoveringTiles: Coordinate2D[] | null) => void
  } = {}

  public setCallbacks = (callbacks: typeof this.callbacks) => {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }
  public connectToMatch = (userId: string, matchId: string) => {
    console.log("ENTER: connectToMatch")
    this._isConnecting = true
    this.socket = io("http://localhost:3000", {
      query: { userId, matchId },
      autoConnect: false,
    })

    this.socket.on("connect", () => {})

    this.socket.on(
      ServerEvent.PLAYER_CONNECTED_TO_MATCH,
      (match: MatchRich) => {
        this.callbacks.setMatch?.(match)
        if (match.gameSettings) {
          this.callbacks.setGameSettings?.(match.gameSettings)
        }
        this.lastUpdatedAt = new Date().toISOString()
      }
    )

    this.socket.on(ServerEvent.DISCONNECTED_FROM_MATCH, () => {
      console.log("connectToMatch:disconnectedFromMatch")
    })

    this.socket.on("TIME_REMAINING", (data) => {
      console.log("timer", data)
    })

    this.socket.on(
      ServerEvent.UPDATED_GAME_SETTINGS,
      (gameSettings: GameSettings) => {
        this.callbacks.setGameSettings?.(gameSettings)
      }
    )

    this.socket.on(
      ServerEvent.HOVERED,
      (hoveredCoordinates: Coordinate2D[] | null) => {
        this.callbacks.setOpponentsHoveredTiles?.(hoveredCoordinates)
      }
    )

    this.socket.on("connect_error", (error: Error) => {
      console.error("connect error", error)
      throw error
    })

    this.socket.connect()
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

  async sendHoveredCoordinates(hoveredCoordinates: Coordinate2D[] | null) {
    await socketApi.sendRequest({
      event: ClientEvent.HOVER,
      data: hoveredCoordinates,
    })
  }
}

export const socketApi = new SocketIOApi()
