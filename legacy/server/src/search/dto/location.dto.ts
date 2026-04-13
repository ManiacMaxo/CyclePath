import { IsNumber, IsString } from 'class-validator'

export class LocationDto {
    @IsNumber()
    lat: number

    @IsNumber()
    lng: number

    @IsString()
    name: string

    @IsString()
    address: string
}
