import { LatLngLiteral } from 'leaflet'
import React from 'react'
import { MapContainer as LeafletContainer } from 'react-leaflet'
import { MapProvider } from './MapProvider'

interface Props {}

const MapContainer: React.FC<Props> = (props) => {
    const defaultLocation: LatLngLiteral = {
        lat: 37.3347986,
        lng: -122.0091069
    }

    return (
        <LeafletContainer
            center={defaultLocation}
            zoom={15}
            className='map'
            zoomControl={false}
        >
            <MapProvider />
        </LeafletContainer>
    )
}

export { MapContainer }
