import { useCallback, useContext } from 'react'
import { AuthContext } from '../../context/Auth/AuthContext'
import { AuthContextInterface } from '../../context/Auth/AuthContext.interface'
import { RateRouteDto } from './RateRouteDto'

const RATE_ROUTE_URL: string = `${process.env.REACT_APP_API_URL}/routes/rate`

export const useRateRoute = (): ((rateRouteDto: RateRouteDto) => void) => {
    const { authState } = useContext<AuthContextInterface>(AuthContext)

    const rateRoute = useCallback(
        (rateRouteDto: RateRouteDto) => {
            fetch(RATE_ROUTE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authState?.token}`
                },
                body: JSON.stringify(rateRouteDto)
            })
        },
        [authState]
    )

    return rateRoute
}
