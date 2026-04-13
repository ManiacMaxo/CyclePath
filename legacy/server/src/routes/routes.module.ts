import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Neo4jService } from 'nest-neo4j/dist'
import { NodesModule } from 'src/nodes/nodes.module'
import { RoutesRatingRepository } from './repository/routes-rating.repository'
import { RoutesRepository } from './repository/routes.repository'
import { RoutesController } from './routes.controller'
import { RoutesService } from './routes.service'

@Module({
    imports: [TypeOrmModule.forFeature([RoutesRatingRepository]), NodesModule],
    controllers: [RoutesController],
    providers: [RoutesService, RoutesRepository]
})
export class RoutesModule {
    constructor(private readonly neo4jService: Neo4jService) {}
}
