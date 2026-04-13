import { LatLngLiteral, LocationEvent, Map as LeafletMap } from 'leaflet'
import React, { useEffect, useState } from 'react'
import { useMapEvents } from 'react-leaflet'
import { Search } from '../../components'
import { Map } from './Map'

interface Props {}

export const MapProvider: React.FC<Props> = (props) => {
    const [position, setPosition] = useState<LatLngLiteral | null>(null)
    const [destination, setDestination] = useState<LatLngLiteral | null>(null)

    const map: LeafletMap = useMapEvents({
        locationfound(event: LocationEvent) {
            // setPosition(event.latlng);
            setPosition({ lat: 43.73429996534598, lng: 7.418578619024726 })
            map.flyTo(
                { lat: 43.73429996534598, lng: 7.418578619024726 },
                map.getZoom(),
                { duration: 1 }
            )
        }
    })

    useEffect(() => {
        map.locate()
        const pane = map.createPane('popup')

        pane.style.zIndex = '600'
    }, [])

    return (
        <>
            <Search position={position} setDestination={setDestination} />
            <Map destination={destination} position={position} />
        </>
    )
}
