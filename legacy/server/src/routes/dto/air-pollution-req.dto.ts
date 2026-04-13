import { IsArray, IsNumber, ValidateNested } from 'class-validator';

export class AirPollutionArrayDto {
    @IsArray()
    @ValidateNested({each: true})
    airPollutions:AirPollutionReqDto[]
}

export class AirPollutionReqDto {
  @IsNumber()
  startLat: number

  @IsNumber()
  startLon: number

  @IsNumber()
  endLat: number

  @IsNumber()
  endLon: number
}