import { Circle } from 'react-leaflet'
import type { AirPollutionResponse, RouteSegment } from '@/types/api'

type AirPollutionProps = {
  segments: RouteSegment[]
  data: AirPollutionResponse[]
}

function getPollutionColor(pollutionIndex: number) {
  if (pollutionIndex < 30) {
    return '#84cc16'
  }

  if (pollutionIndex < 60) {
    return '#eab308'
  }

  if (pollutionIndex < 90) {
    return '#f97316'
  }

  if (pollutionIndex < 120) {
    return '#ef4444'
  }

  return '#78350f'
}

export default function AirPollution({ segments, data }: AirPollutionProps) {
  if (data.length === 0) {
    return null
  }

  return segments.map((segment, index) => {
    const measurement = data[index]

    if (!measurement) {
      return null
    }

    const midpoint: [number, number] = [
      (segment.start.lat + segment.end.lat) / 2,
      (segment.start.long + segment.end.long) / 2,
    ]

    return (
      <Circle
        center={midpoint}
        fillColor={getPollutionColor(measurement.pollutionIndex)}
        fillOpacity={0.28}
        key={`${segment.start.id}-${segment.end.id}-${measurement.measurementTime}`}
        pathOptions={{
          color: getPollutionColor(measurement.pollutionIndex),
          opacity: 0.7,
          weight: 1,
        }}
        radius={Math.max(18, measurement.pollutionIndex * 2.5)}
      />
    )
  })
}
