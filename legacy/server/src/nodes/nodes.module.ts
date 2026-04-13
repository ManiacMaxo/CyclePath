import { Module } from '@nestjs/common'
import { Neo4jService } from 'nest-neo4j/dist'
import { NodesController } from './nodes.controller'
import { NodesService } from './nodes.service'
import { NodesRepository } from './repository/nodes.repository'

@Module({
    controllers: [NodesController],
    providers: [NodesService, NodesRepository],
    exports: [NodesService, NodesRepository]
})
export class NodesModule {
    constructor(private readonly neo4jService: Neo4jService) {}
}
