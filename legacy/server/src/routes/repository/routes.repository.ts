import { Injectable, NotFoundException } from '@nestjs/common'
import { QueryResult } from 'neo4j-driver'
import { Neo4jService } from 'nest-neo4j/dist'
import { Route } from '../entities/route.entity'

@Injectable()
export class RoutesRepository {
    constructor(private readonly neo4jService: Neo4jService) {}

    async getRouteByNodesIds(nodeOneId: number, nodeTwoId: number): Promise<Route> {
        const queryResult: QueryResult = await this.neo4jService.read(
            `
            MATCH (node1: Node{node_id: $nodeOneId})-[route: Route]-(node2: Node{node_id: $nodeTwoId}) 
            RETURN route LIMIT 1`,
            { nodeOneId, nodeTwoId }
        )

        if (!queryResult.records.length) {
            throw new NotFoundException()
        }

        return new Route(queryResult.records[0].get('route'))
    }

    async updateRouteRating(id: number, rating: number): Promise<void> {
        console.log(rating)
        await this.neo4jService.write(
            `
            MATCH (:Node)-[route: Route]-(:Node)
            WHERE id(route) = $id
            SET
                route.rating = $rating,
                route.cost = $rating * route.distance`,
            { id, rating: rating }
        )
    }

    async getRoutesByNodesIds(nodeIds: number[][]): Promise<Route[]> {
        const queryResult = await this.neo4jService.read(
            `
            UNWIND $nodeIds as nodes 
            MATCH
                (start: Node)-[route:Route]-(end: Node)
            WHERE start.node_id = nodes[0] and end.node_id = nodes[1]
            RETURN route`,
            { nodeIds }
        )
        return queryResult.records.map(route => {
            return new Route(route.get('route'))
        })
    }
}
