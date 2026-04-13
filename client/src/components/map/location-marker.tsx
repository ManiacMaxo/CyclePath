import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'

type LocationMarkerProps = {
  start: [number, number] | null
  end: [number, number] | null
}

const startIcon = L.divIcon({
  className: 'cyclepath-start-marker',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#22c55e;border:3px solid white;box-shadow:0 6px 18px rgba(0,0,0,0.22);"></div>',
  iconAnchor: [9, 9],
  iconSize: [18, 18],
})

const endIcon = L.divIcon({
  className: 'cyclepath-end-marker',
  html: '<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#ef4444;border:3px solid white;box-shadow:0 6px 18px rgba(0,0,0,0.24);"><div style="width:7px;height:7px;border-radius:9999px;background:white;"></div></div>',
  iconAnchor: [12, 12],
  iconSize: [24, 24],
})

export default function LocationMarker({ start, end }: LocationMarkerProps) {
  return (
    <>
      {start ? (
        <Marker icon={startIcon} position={start}>
          <Popup>Start</Popup>
        </Marker>
      ) : null}
      {end ? (
        <Marker icon={endIcon} position={end}>
          <Popup>Destination</Popup>
        </Marker>
      ) : null}
    </>
  )
}
