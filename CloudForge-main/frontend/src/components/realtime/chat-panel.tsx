"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRealtime } from "../../contexts/realtime-context"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { MessageCircle, Send, Users, Wifi, WifiOff } from "lucide-react"

export function ChatPanel() {
  const { messages, sendChatMessage, connectionStatus, roomPlayers } = useRealtime()
  const [newMessage, setNewMessage] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatMessages = messages.filter((m) => m.type === "chat")

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && connectionStatus.isConnected) {
      sendChatMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        {chatMessages.length > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500">{chatMessages.length}</Badge>
        )}
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {connectionStatus.isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-muted-foreground">{connectionStatus.latency.toFixed(0)}ms</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                ×
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{roomPlayers.length} players online</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <ScrollArea className="h-64 w-full">
            <div className="space-y-2 pr-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{message.from}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm bg-muted rounded-lg p-2">{message.data.message}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!connectionStatus.isConnected}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || !connectionStatus.isConnected}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {!connectionStatus.isConnected && (
            <div className="text-center text-sm text-red-600">Disconnected - trying to reconnect...</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
