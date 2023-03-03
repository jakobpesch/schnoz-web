import { GameSettings, Match } from "@prisma/client"
import { io } from "socket.io-client"
import { Socket } from "socket.io-client"
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

  public connectToMatch = (
    userId: string,
    matchId: string,
    callback?: {
      setMatch?: (match: MatchRich) => void
      setGameSettings?: (gameSettings: GameSettings) => void
    }
  ) => {
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
        console.log("connectToMatch:" + ServerEvent.PLAYER_CONNECTED_TO_MATCH, {
          match,
        })

        callback?.setMatch?.(match)
        console.log("wtf")

        this.lastUpdatedAt = new Date().toISOString()
        console.log(this.lastUpdatedAt)
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
        console.log("connectToMatch:updateGameSettings", gameSettings)
        if (this.match) {
          this.match.gameSettings = gameSettings
        }
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
}

export const socketApi = new SocketIOApi()
