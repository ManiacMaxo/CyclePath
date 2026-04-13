import { FormControlLabel, Switch, useMediaQuery } from '@material-ui/core'
import { LatLngLiteral } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { useCallback, useEffect, useState } from 'react'
import { FaRoute, FaSmog } from 'react-icons/fa'
import { Pane, TileLayer, useMap } from 'react-leaflet'
import { v4 as uuid } from 'uuid'
import {
    AirPollutionWrapper,
    LocationMarker,
    PolyLine,
    Route
} from '../../components'
import { useGetRoute } from '../../hooks'
import styles from './Map.module.scss'

interface Props {
    destination: LatLngLiteral | null
    position: LatLngLiteral | null
}

export const Map: React.FC<Props> = (props) => {
    const map = useMap()
    const { getRoute, routes } = useGetRoute()

    const [visible, setVisible] = useState<boolean>(false)

    const [active, setActive] = useState<number>(0)

    const toggleRoute = () => {
        setActive((a) => (a === 0 ? 1 : 0))
    }

    const [shouldReload, setShouldReload] = useState<boolean>(true)

    const matches = useMediaQuery('(min-width:600px)')

    const forceReload = useCallback(() => {
        setShouldReload(true)
    }, [])

    useEffect(() => {
        if (props.destination && props.position) {
            getRoute(
                [props.position.lat, props.position.lng],
                [props.destination.lat, props.destination.lng]
            )
            map.fitBounds([
                [props.position.lat, props.position.lng],
                [props.destination.lat, props.destination.lng]
            ])
            setShouldReload(false)
        }
    }, [props.destination, props.position, shouldReload])

    return (
        <>
            <FormControlLabel
                control={
                    <Switch
                        checked={visible}
                        onChange={() => {
                            setVisible((v) => !v)
                        }}
                        name='air-toggle'
                        color='primary'
                    />
                }
                label={
                    matches ? (
                        'Air pollution'
                    ) : (
                        <FaSmog className={styles.icon} />
                    )
                }
                className={styles.toggle}
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={active === 0}
                        onChange={toggleRoute}
                        name='routes'
                        color='primary'
                    />
                }
                label={
                    matches ? 'Best route' : <FaRoute className={styles.icon} />
                }
                className={styles.routes}
            />

            <Pane name='best-route'>
                {routes &&
                    routes[0].map((route: Route) => (
                        <PolyLine
                            key={uuid()}
                            route={route}
                            forceReload={forceReload}
                            active={active === 0}
                            name='best-route'
                        />
                    ))}
            </Pane>
            <Pane name='fastest-route'>
                {routes &&
                    routes[1].map((route: Route) => (
                        <PolyLine
                            key={uuid()}
                            route={route}
                            forceReload={forceReload}
                            name='fastest-route'
                            active={active === 1}
                        />
                    ))}
            </Pane>

            <Pane style={{ zIndex: 399 }} name='air-polution'>
                {routes && (
                    <AirPollutionWrapper
                        routes={routes[0]}
                        visible={visible && active === 0}
                    />
                )}
                {routes && (
                    <AirPollutionWrapper
                        routes={routes[1]}
                        visible={visible && active === 1}
                    />
                )}
            </Pane>
            <TileLayer
                zIndex={-100}
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <LocationMarker
                message='Current location'
                position={props.position}
            />
            <LocationMarker
                message='Destination'
                position={props.destination}
            />
        </>
    )
}
