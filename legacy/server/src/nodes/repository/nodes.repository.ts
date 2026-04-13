import { Injectable, NotFoundException } from '@nestjs/common'
import { Neo4jService } from 'nest-neo4j/dist'
import { QueryResult, integer, int } from 'neo4j-driver'
import { Node } from '../entities/node.entity'
import { RouteSegment } from '../entities/route-segment.entity'

@Injectable()
export class NodesRepository {
    constructor(private readonly neo4jService: Neo4jService) {}

    async getAllNodes(): Promise<Node[]> {
        const queryResult: QueryResult = await this.neo4jService.read(`
            MATCH (node:Node)
            return node`)
        return queryResult.records.map(node => {
            const graphNode = node.get('node')
            const nodeEntity = new Node(
                graphNode.properties['lat'],
                graphNode.properties['long'],
                graphNode.properties['node_id']
            )
            return nodeEntity
        })
    }

    async findShortestRouteBetweenTwoNodes(
        startNodeId: number | string,
        endNodeId: number | string,
        criteria: string
    ): Promise<RouteSegment[]> {
        await this.rebuildGdsGraph()
        const queryResult: QueryResult = await this.neo4jService.read(
            `
            MATCH
                (startNode:Node {node_id: $startNodeId}),
                (endNode:Node {node_id: $endNodeId})
            CALL gds.beta.shortestPath.dijkstra.stream('nodesGraph', {
                sourceNode: id(startNode),
                targetNode: id(endNode),
                path: true,
                relationshipWeightProperty: $criteria
            })
            YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
            RETURN
                path`,
            { startNodeId, endNodeId, criteria }
        )
        console.log(startNodeId, endNodeId)
        console.log(queryResult.records)
        if (queryResult.records.length === 0) {
            return []
        }
        return queryResult.records[0].get('path').segments.map(segment => {
            const start = new Node(
                segment.start.properties['lat'],
                segment.start.properties['long'],
                segment.start.properties['node_id']
            )
            const end = new Node(
                segment.end.properties['lat'],
                segment.end.properties['long'],
                segment.end.properties['node_id']
            )
            return new RouteSegment(start, end, segment.relationship.properties['cost'])
        })
    }

    private async rebuildGdsGraph(): Promise<void> {
        await this.neo4jService.write(`CALL gds.graph.drop('nodesGraph')`)
        await this.neo4jService.write(`
        CALL gds.graph.create(
            'nodesGraph',
            'Node',
            'Route',
            {
                relationshipProperties: ['rating', 'cost', 'distance']
            }
        )`)
    }
}
