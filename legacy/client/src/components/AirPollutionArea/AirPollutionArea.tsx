import React from 'react'
import { Circle, useMap } from 'react-leaflet'
import { Route } from '../PolyLine/Route'

interface Props {
    route: Route
    airPollution: number
}

const AreaColorMap = new Map<number, string>([
    [30, 'lime'],
    [60, 'yellow'],
    [90, 'orange'],
    [120, 'red'],
    [150, 'brown']
])

const AirPollutionArea: React.FC<Props> = ({ route, airPollution }) => {
    const map = useMap()

    if (!airPollution) {
        return null
    }

    let color: string = 'blue'

    AreaColorMap.forEach((colorValue: string, number: number) => {
        if (color !== 'blue') {
            return
        }

        color = airPollution >= number ? 'blue' : colorValue
    })

    return (
        <Circle
            center={{
                lat: (route.start.lat + route.end.lat) / 2,
                lng: (route.start.long + route.end.long) / 2
            }}
            radius={
                map.distance(
                    [route.start.lat, route.start.long],
                    [route.end.lat, route.end.long]
                ) / 2
            }
            color={color}
        />
    )
}

export { AirPollutionArea }
