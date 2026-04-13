import { Box, Button, Typography } from '@material-ui/core'
import {
    SentimentDissatisfied,
    SentimentSatisfied,
    SentimentSatisfiedAlt,
    SentimentVeryDissatisfied,
    SentimentVerySatisfied
} from '@material-ui/icons'
import { IconContainerProps, Rating } from '@material-ui/lab'
import React, { useEffect, useMemo, useState } from 'react'
import { Polyline, Popup, useMap } from 'react-leaflet'
import { useRateRoute } from '../../hooks/useRateRoute/useRateRoute'
import styles from './PolyLine.module.scss'
import { Route } from './Route'

interface Props {
    route: Route
    forceReload: () => void
    active: boolean
    name: string
}

const ratingColorMap = new Map<number, string>([
    [1, 'red'],
    [2, 'orange'],
    [3, 'yellow'],
    [4, 'green'],
    [5, 'lime']
])

const customIcons: {
    [index: string]: { icon: React.ReactElement; label: string }
} = {
    1: {
        icon: <SentimentVeryDissatisfied />,
        label: 'Very Dissatisfied'
    },
    2: {
        icon: <SentimentDissatisfied />,
        label: 'Dissatisfied'
    },
    3: {
        icon: <SentimentSatisfied />,
        label: 'Neutral'
    },
    4: {
        icon: <SentimentSatisfiedAlt />,
        label: 'Satisfied'
    },
    5: {
        icon: <SentimentVerySatisfied />,
        label: 'Very Satisfied'
    }
}

function IconContainer(props: IconContainerProps) {
    const { value, ...other } = props
    return <span {...other}>{customIcons[value].icon}</span>
}

export const PolyLine: React.FC<Props> = ({
    route,
    forceReload,
    active,
    name
}) => {
    const rateRoute = useRateRoute()

    const [rating, setRating] = useState<number>(1)

    const map = useMap()

    const pane = useMemo(() => {
        return map.getPane(name)
    }, [map, name])

    useEffect(() => {
        if (!pane) {
            return
        }

        if (active) {
            pane.style.zIndex = '400'
            return
        }

        pane.style.zIndex = '399'
    }, [active, map])

    return (
        <Polyline
            color={active ? ratingColorMap.get(route.rating) : 'grey'}
            positions={[
                [route.start.lat, route.start.long],
                [route.end.lat, route.end.long]
            ]}
            pathOptions={{ weight: 6, className: styles.Polyline }}
        >
            {active && (
                <Popup pane='popup' className={styles.PopUp}>
                    <Box
                        className={styles.Box}
                        component='fieldset'
                        borderColor='transparent'
                    >
                        <Typography variant='h6' component='legend'>
                            Rate Route
                        </Typography>
                        <Rating
                            name='customized-icons'
                            size='large'
                            value={rating}
                            onChange={(e, value: number | null) => {
                                if (!value) {
                                    return
                                }

                                setRating(value)
                            }}
                            getLabelText={(value: number) =>
                                customIcons[value].label
                            }
                            color={ratingColorMap.get(rating)}
                            IconContainerComponent={IconContainer}
                        />
                    </Box>
                    <Button
                        variant='contained'
                        fullWidth
                        color='primary'
                        onClick={() => {
                            map.closePopup()
                            rateRoute({
                                nodeOneId: route.start.nodeId,
                                nodeTwoId: route.end.nodeId,
                                rating
                            })
                            forceReload()
                        }}
                    >
                        Submit
                    </Button>
                </Popup>
            )}
        </Polyline>
    )
}
