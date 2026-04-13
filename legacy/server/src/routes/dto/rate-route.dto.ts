import { IsNumber } from 'class-validator'

export class RateRouteDto {
    @IsNumber()
    nodeOneId: number

    @IsNumber()
    nodeTwoId: number

    @IsNumber()
    rating: number
}
