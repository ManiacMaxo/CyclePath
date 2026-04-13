import React, { useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { useGetAirPollution } from '../../hooks'
import { Route } from '../PolyLine/Route'
import { AirPollutionArea } from './AirPollutionArea'

interface Props {
    routes: Route[]
    visible: boolean
}

const AirPollutionWrapper: React.FC<Props> = ({ routes, visible }) => {
    const { airPollutions, getAirPollutions } = useGetAirPollution()

    useEffect(() => {
        getAirPollutions(routes)
    }, [routes])

    if (!airPollutions || !routes) {
        return null
    }

    return (
        <>
            {visible &&
                routes.map((route: Route, index: number) => (
                    <AirPollutionArea
                        key={uuid()}
                        route={route}
                        airPollution={airPollutions[index]}
                    />
                ))}
        </>
    )
}

export { AirPollutionWrapper }
