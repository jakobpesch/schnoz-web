import { GameSettings, Match, User } from "@prisma/client"
import { useEffect, useState } from "react"
import { socketApi } from "../services/SocketService"
import { MatchRich } from "../types/Match"

export function useMatch(userId: User["id"], matchId: Match["id"]) {
  const [match, setMatch] = useState<MatchRich>()
  const [gameSettings, setGameSettings] = useState<GameSettings>()
  useEffect(() => {
    if (socketApi.isConnected) {
      return
    }
    if (!userId || !matchId) {
      return
    }
    if (!socketApi.isConnected) {
      socketApi.setCallbacks({ setMatch, setGameSettings })
      socketApi.connectToMatch(userId, matchId)
    }
  }, [matchId, userId])
  return { match, gameSettings }
}
