import { Controller, Get, InternalServerErrorException, Query } from '@nestjs/common'
import { LocationDto } from './dto'
import { SearchService } from './search.service'

@Controller('search')
export class SeachController {
    constructor(private readonly searchService: SearchService) {}

    @Get()
    async get(
        @Query('query') query: string,
        @Query('location') location: string,
        @Query('locale') language: string = 'en'
    ): Promise<LocationDto> {
        return this.searchService.fetchGmaps(query, location, language)
    }
}
