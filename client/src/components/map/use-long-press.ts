import type { LeafletEvent, Map as LeafletMap, Point } from 'leaflet'
import { useEffect } from 'react'

type LongPressCallback = (lat: number, lng: number) => void

type UseLongPressOptions = {
  duration?: number
  movementThreshold?: number
  onShortClick?: () => void
}

type PressState = {
  fired: boolean
  isPointerDown: boolean
  moved: boolean
  startedAt: number
  startPoint: Point | null
  timer: ReturnType<typeof window.setTimeout> | null
}

export function useLongPress(
  map: LeafletMap,
  onLongPress: LongPressCallback,
  {
    duration = 500,
    movementThreshold = 10,
    onShortClick,
  }: UseLongPressOptions = {},
) {
  useEffect(() => {
    const pressState: PressState = {
      fired: false,
      isPointerDown: false,
      moved: false,
      startedAt: 0,
      startPoint: null,
      timer: null,
    }

    const clearTimer = () => {
      if (pressState.timer !== null) {
        window.clearTimeout(pressState.timer)
        pressState.timer = null
      }
    }

    const resetPress = () => {
      clearTimer()
      pressState.fired = false
      pressState.isPointerDown = false
      pressState.moved = false
      pressState.startedAt = 0
      pressState.startPoint = null
    }

    const getContainerPoint = (event: LeafletEvent): Point | null => {
      if ('containerPoint' in event) {
        return event.containerPoint as Point
      }

      return null
    }

    const updateMovement = (event: LeafletEvent) => {
      const containerPoint = getContainerPoint(event)

      if (!pressState.isPointerDown || !pressState.startPoint) {
        return
      }

      if (!containerPoint) {
        return
      }

      if (
        containerPoint.distanceTo(pressState.startPoint) > movementThreshold
      ) {
        pressState.moved = true
        clearTimer()
      }
    }

    const handlePointerStart = (event: LeafletEvent) => {
      const containerPoint = getContainerPoint(event)

      if (!containerPoint) {
        return
      }

      resetPress()
      pressState.isPointerDown = true
      pressState.startedAt = Date.now()
      pressState.startPoint = containerPoint
      pressState.timer = window.setTimeout(() => {
        if (
          !pressState.isPointerDown ||
          pressState.moved ||
          !pressState.startPoint
        ) {
          return
        }

        pressState.fired = true
        const latLng = map.containerPointToLatLng(pressState.startPoint)
        onLongPress(latLng.lat, latLng.lng)
      }, duration)
    }

    const handlePointerEnd = () => {
      if (!pressState.isPointerDown) {
        return
      }

      const wasShortClick =
        !pressState.fired &&
        !pressState.moved &&
        Date.now() - pressState.startedAt < duration

      resetPress()

      if (wasShortClick) {
        onShortClick?.()
      }
    }

    map.on('mousedown', handlePointerStart)
    map.on('touchstart', handlePointerStart)
    map.on('mousemove', updateMovement)
    map.on('touchmove', updateMovement)
    map.on('mouseup', handlePointerEnd)
    map.on('touchend', handlePointerEnd)
    map.on('mouseout', handlePointerEnd)
    map.on('dragstart', resetPress)

    return () => {
      resetPress()
      map.off('mousedown', handlePointerStart)
      map.off('touchstart', handlePointerStart)
      map.off('mousemove', updateMovement)
      map.off('touchmove', updateMovement)
      map.off('mouseup', handlePointerEnd)
      map.off('touchend', handlePointerEnd)
      map.off('mouseout', handlePointerEnd)
      map.off('dragstart', resetPress)
    }
  }, [duration, map, movementThreshold, onLongPress, onShortClick])
}
