import { DivIcon, LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import styles from './Map.module.scss'

interface Props {}

const Map: React.FC<Props> = () => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [location, setLocation] = useState<LatLngExpression | null>({
        lat: 37.3347986,
        lng: -122.0091069
    })

    const places = [
        { lat: 43.731026, lng: 7.425535 },
        { lat: 43.740163, lng: 7.424286 },
        { lat: 43.740454, lng: 7.425592 }
    ]
    const [edges, setEdges] = useState<LatLngExpression[]>(places)

    useEffect(() => {
        navigator?.geolocation.getCurrentPosition(
            (location) => {
                setLocation(null)
                const { latitude, longitude } = location.coords
                // setLocation({ lat: latitude, lng: longitude })
                setLocation(places[0])
                getRoute({ lat: latitude, lng: longitude }, places[0])
            },
            (error: any) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setErrorMsg('User denied the request for Geolocation.')
                        break
                    case error.POSITION_UNAVAILABLE:
                        setErrorMsg('Location information is unavailable.')
                        break
                    case error.TIMEOUT:
                        setErrorMsg(
                            'The request to get user location timed out.'
                        )
                        break
                    case error.UNKNOWN_ERROR:
                        setErrorMsg('An unknown error occurred.')
                        break
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }, [])

    const getRoute = (start: LatLngExpression, end: LatLngExpression) => {
        fetch(
            process.env.REACT_APP_API_URL + `/route?start=${start}&end=${end}`
        )
            .then((res) => {
                if (res.ok) {
                    return res.json()
                }
                return []
            })
            .then((data) => {
                setEdges(data)
            })
    }

    // const rateRoute = (route: any) => {
    //     fetch(process.env.REACT_APP_API_URL || '')
    // }

    return location ? (
        <MapContainer center={location} zoom={15} className={styles.root}>
            {/* {edges.map((edge: any) => (
                <Polyline
                    positions={[location, edge]}
                    // onClick={rateRoute.bind(null, edge)}
                />
            ))} */}
            <Polyline positions={edges} />
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            <Marker
                position={location}
                icon={
                    new DivIcon({
                        html: `<img src='/images/marker-icon.png' alt='marker'/>`
                    })
                }
            >
                <Popup>{errorMsg || 'Your location'}</Popup>
            </Marker>

            <Marker
                position={places[places.length - 1]}
                icon={
                    new DivIcon({
                        html: `<img src='/images/marker-icon.png' alt='marker'/>`
                    })
                }
            >
                <Popup>Destination</Popup>
            </Marker>
        </MapContainer>
    ) : null
}

export default Map