import { HttpService } from '@nestjs/axios'
import { BadRequestException, Injectable } from '@nestjs/common'
import { LocationDto } from './dto'

@Injectable()
export class SearchService {
    constructor(private readonly httpService: HttpService) {}

    async fetchGmaps(query: string, location: string, language: string): Promise<LocationDto> {
        // matches format like "123.1234,123.1234"
        const locationStringRegex = /(\d*\.)?\d+,+((\d*\.)?\d)+/

        if (!query || !locationStringRegex.test(location)) {
            throw new BadRequestException()
        }

        const res = await this.httpService
            .get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
                params: {
                    // input: query,
                    // inputtype: 'textquery',
                    // fields: 'formatted_address,name,geometry',
                    // locationbias: `circle:5000@${location}`,
                    keyword: query,
                    rankby: 'distance',
                    language,
                    location,
                    key: process.env.MAPS_KEY
                }
            })
            .toPromise()

        console.log(res.data.results)

        return res.data.results.map(result => ({
            name: result.name,
            address: result.vicinity,
            ...result.geometry.location
        }))
    }
}
