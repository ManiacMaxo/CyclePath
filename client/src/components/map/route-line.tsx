import { Fragment } from 'react'
import { Polyline } from 'react-leaflet'
import type { RouteSegment } from '@/types/api'

type RouteLineProps = {
  segments: RouteSegment[]
  active: boolean
  onSegmentClick: (segment: RouteSegment) => void
}

const ratingColors: Record<number, string> = {
  0: '#94a3b8',
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#84cc16',
  5: '#22c55e',
}

function getSegmentColor(rating: number | null) {
  return ratingColors[rating ?? 0] ?? ratingColors[0]
}

export default function RouteLine({
  segments,
  active,
  onSegmentClick,
}: RouteLineProps) {
  return segments.map((segment) => (
    <Fragment key={`${segment.start.id}-${segment.end.id}`}>
      <Polyline
        eventHandlers={
          active
            ? {
                click: () => onSegmentClick(segment),
              }
            : undefined
        }
        pathOptions={{
          color: active ? getSegmentColor(segment.rating) : '#94a3b8',
          lineCap: 'round',
          lineJoin: 'round',
          opacity: active ? 0.8 : 0.4,
          weight: active ? 6 : 4,
        }}
        positions={[
          [segment.start.lat, segment.start.long],
          [segment.end.lat, segment.end.long],
        ]}
      />
    </Fragment>
  ))
}
