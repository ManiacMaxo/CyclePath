import { CircleMarker, LayerGroup, Polyline } from 'react-leaflet'
import type { DebugGraphEdge, DebugGraphNode } from '@/types/api'

type DebugGraphOverlayProps = {
  nodes: DebugGraphNode[]
  edges: DebugGraphEdge[]
}

export default function DebugGraphOverlay({ nodes, edges }: DebugGraphOverlayProps) {
  const nodeMap = new Map<number, [number, number]>()
  for (const node of nodes) {
    nodeMap.set(node.id, [node.lat, node.long])
  }

  return (
    <LayerGroup>
      {edges.map((edge) => {
        const start = nodeMap.get(edge.start_node_id)
        const end = nodeMap.get(edge.end_node_id)
        if (!start || !end) return null

        return (
          <Polyline
            key={`${edge.start_node_id}-${edge.end_node_id}`}
            pathOptions={{
              color: '#64748b',
              opacity: 0.3,
              weight: 1,
            }}
            positions={[start, end]}
          />
        )
      })}
      {nodes.map((node) => (
        <CircleMarker
          center={[node.lat, node.long]}
          fillOpacity={0.5}
          key={node.id}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.5,
            opacity: 0.6,
            weight: 1,
          }}
          radius={2}
        />
      ))}
    </LayerGroup>
  )
}
