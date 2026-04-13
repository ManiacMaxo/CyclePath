import { Controller, Get } from '@nestjs/common'
import { Neo4jService } from 'nest-neo4j/dist'
import { AppService } from './app.service'
import { Route } from './routes/entities/route.entity'

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly neo4jService: Neo4jService
    ) {}

    @Get()
    getHello(): string {
        return this.appService.getHello()
    }

    @Get('/all')
    async getAll() {
        const queryResult = await this.neo4jService.read(
            `
            UNWIND $nodeIds as nodes 
            MATCH
                (start: Node)-[route:Route]-(end: Node)
            WHERE start.node_id = nodes[0] and end.node_id = nodes[1]
            RETURN route`,
            { nodeIds: [[1204288467, 25194391], [1204288467, 25194391]] }
        )
        queryResult.records.map(route => {
            return new Route(route.get('route'))
        })
    }
}
