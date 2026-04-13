import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { SeachController } from './search.controller'
import { SearchService } from './search.service'

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5
        })
    ],
    controllers: [SeachController],
    providers: [SearchService]
})
export class SearchModule {}
