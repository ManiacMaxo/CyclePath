import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Neo4jModule } from 'nest-neo4j/dist'
import { dirname, join } from 'path'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { TypeOrmConfigService } from './config/typeorm-config.service'
import { NodesModule } from './nodes/nodes.module'
import { RefreshTokenModule } from './refresh-token/refresh-token.module'
import { RoutesModule } from './routes/routes.module'
import { SearchModule } from './search/search.module'
import { UsersModule } from './users/users.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: join(dirname(__dirname), '.env')
        }),
        TypeOrmModule.forRootAsync({
            useClass: TypeOrmConfigService
        }),
        Neo4jModule.fromEnv(),
        RoutesModule,
        NodesModule,
        UsersModule,
        RefreshTokenModule,
        AuthModule,
        SearchModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
