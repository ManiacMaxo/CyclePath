import type { Marker as LeafletMarker } from 'leaflet'
import L from 'leaflet'
import { MapPin, Navigation } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { Button } from '@/components/ui/button'

type LongPressMarkerProps = {
  position: [number, number] | null
  onSelect: (lat: number, lng: number) => void
  onClear: () => void
}

export default function LongPressMarker({
  position,
  onSelect,
  onClear,
}: LongPressMarkerProps) {
  const markerRef = useRef<LeafletMarker | null>(null)
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'cyclepath-long-press-marker',
        html: '<div style="position:relative;display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:rgba(59,130,246,0.18);border:1px solid rgba(59,130,246,0.35);box-shadow:0 8px 22px rgba(37,99,235,0.28);"><div style="display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 3px 10px rgba(37,99,235,0.45);"></div></div>',
        iconAnchor: [15, 15],
        iconSize: [30, 30],
      }),
    [],
  )

  useEffect(() => {
    if (!position) return
    const id = window.setTimeout(() => {
      markerRef.current?.openPopup()
    }, 50)
    return () => window.clearTimeout(id)
  }, [position])

  if (!position) {
    return null
  }

  const [lat, lng] = position

  return (
    <Marker icon={icon} position={position} ref={markerRef}>
      <Popup autoClose={false} closeButton={false} closeOnClick={false}>
        <div className='flex min-w-52 flex-col gap-3 p-1'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm font-medium text-foreground'>
              <MapPin className='size-4 text-primary' />
              Dropped pin
            </div>
            <p className='text-xs text-muted-foreground'>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>

          <div className='flex gap-2'>
            <Button
              className='flex-1'
              onClick={() => onSelect(lat, lng)}
              size='sm'
              variant='default'
            >
              <Navigation className='size-4' />
              Route here
            </Button>
            <Button
              className='flex-1'
              onClick={onClear}
              size='sm'
              variant='ghost'
            >
              Cancel
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
