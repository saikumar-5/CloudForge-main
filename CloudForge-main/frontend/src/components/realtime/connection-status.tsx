"use client"

import { useRealtime } from "../../contexts/realtime-context"
import { Badge } from "../ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function ConnectionStatus() {
  // Realtime context exposes isConnected; latency tracking is not provided.
  // Guard for undefined context values to avoid runtime crashes.
  const { isConnected } = useRealtime() || { isConnected: false }

  const getStatusColor = () => {
    return isConnected ? "bg-green-500" : "bg-red-500"
  }

  const getStatusText = () => {
    return isConnected ? "Connected" : "Disconnected"
  }

  const getStatusIcon = () => {
    return isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />
  }

  return (
    <Badge variant="outline" className={`${getStatusColor()} text-white border-0`}>
      <div className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </div>
    </Badge>
  )
}
