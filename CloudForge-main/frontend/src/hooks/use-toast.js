"use client"

import React from "react"

import { useState, useCallback } from "react"

let toastQueue = []
let toastListeners = []

const addToastListener = (listener) => {
  toastListeners.push(listener)
  return () => {
    toastListeners = toastListeners.filter((l) => l !== listener)
  }
}

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toastQueue]))
}

export const toast = ({ title, description, variant = "default" }) => {
  const id = Math.random().toString(36).substr(2, 9)
  const newToast = { id, title, description, variant }

  toastQueue.push(newToast)
  notifyListeners()

  console.log('Toast shown:', { title, description, variant })

  // Auto remove after 5 seconds
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    notifyListeners()
  }, 5000)
}

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const updateToasts = useCallback((newToasts) => {
    setToasts(newToasts)
  }, [])

  // Subscribe to toast updates
  React.useEffect(() => {
    const unsubscribe = addToastListener(updateToasts)
    return unsubscribe
  }, [updateToasts])

  const dismiss = useCallback((id) => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    notifyListeners()
  }, [])

  return {
    toast,
    toasts,
    dismiss,
  }
}
