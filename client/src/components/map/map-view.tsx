import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

type MapViewProps = {
  children: React.ReactNode
}

export default function MapView({ children }: MapViewProps) {
  return (
    <MapContainer
      center={[42.6977, 23.3219]}
      className='h-full w-full'
      scrollWheelZoom
      zoom={13}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {children}
    </MapContainer>
  )
}
