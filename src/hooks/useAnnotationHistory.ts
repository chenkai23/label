import { useState, useCallback } from 'react'
import { Annotation } from '../types/project'

const MAX_HISTORY = 50

export const useAnnotationHistory = (initialAnnotations: Annotation[]) => {
  const [history, setHistory] = useState<Annotation[][]>([initialAnnotations])
  const [currentIndex, setCurrentIndex] = useState(0)

  const pushHistory = useCallback((annotations: Annotation[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1)
      newHistory.push(annotations)
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }
      return newHistory
    })
    setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [currentIndex])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      return history[currentIndex - 1]
    }
    return null
  }, [currentIndex, history])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1)
      return history[currentIndex + 1]
    }
    return null
  }, [currentIndex, history])

  return {
    pushHistory,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  }
} 