import { LatLngTuple } from 'leaflet'
import { useCallback, useState } from 'react'
import { Route } from '../components/PolyLine/Route'

interface GetRoutes {
    routes: [Route[], Route[]] | null
    getRoute: (start: LatLngTuple, end: LatLngTuple) => void
}

const GET_ROUTE_URL: string = `${process.env.REACT_APP_API_URL}/routes`

const params: URLSearchParams = new URLSearchParams()

export const useGetRoute = (): GetRoutes => {
    const [routes, setRoutes] = useState<[Route[], Route[]] | null>(null)

    const getRoute = useCallback((start: LatLngTuple, end: LatLngTuple) => {
        params.set('startNodeLat', start[0].toString())
        params.set('startNodeLong', start[1].toString())
        params.set('endNodeLat', end[0].toString())
        params.set('endNodeLong', end[1].toString())
        // console.debug(GET_ROUTE_URL + '?' + params.toString())
        fetch(GET_ROUTE_URL + '?' + params.toString())
            .then((res) => res.json())
            .then((data) => {
                setRoutes(data)
            })
    }, [])

    return {
        routes,
        getRoute
    }
}
