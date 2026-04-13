import {
    CircularProgress,
    ClickAwayListener,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    TextField
} from '@material-ui/core'
import { Search as SearchIcon } from '@material-ui/icons'
import { LatLngLiteral } from 'leaflet'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import styles from './Search.module.scss'

interface Props {
    position: LatLngLiteral | null
    setDestination: Dispatch<SetStateAction<LatLngLiteral | null>>
}

interface Result extends LatLngLiteral {
    name: string
    address: string
}

const Search: React.FC<Props> = (props) => {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<Result[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDisabled, setIsDisabled] = useState(false)

    const map = useMap()

    const getDestinationFromSearch = (search: string) => {
        if (!search.trim() || !props.position) return

        setIsLoading(true)

        const searchQuery: string = `query=${search.split(' ').join('+')}`

        fetch(
            `${process.env.REACT_APP_API_URL}/search?${searchQuery}&location=${props.position.lat},${props.position.lng}`
        )
            .then((res: Response) => {
                console.debug('got fetch response')
                if (!res.ok) return
                return res.json()
            })
            .then((data) => {
                setResults(data)
                setIsDisabled(true)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    const clickHandler = (result: any) => {
        setSearch('')
        setResults([])
        setIsDisabled(false)

        props.setDestination({
            lat: result.lat,
            lng: result.lng
        })
    }

    useEffect(() => {
        if (isDisabled) {
            map.scrollWheelZoom.disable()
            return
        }

        map.scrollWheelZoom.enable()
    }, [isDisabled])

    return (
        <>
            <ClickAwayListener onClickAway={() => setIsDisabled(false)}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        getDestinationFromSearch(search)
                    }}
                    className={styles.container}
                >
                    <TextField
                        id='input-with-icon-textfield'
                        value={search}
                        variant='outlined'
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSearch(e.target.value)
                        }}
                        autoComplete='off'
                        fullWidth
                        className={styles.input}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SearchIcon color='primary' />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position='end'>
                                    {isLoading && (
                                        <CircularProgress
                                            color='primary'
                                            size='1.5em'
                                        />
                                    )}
                                </InputAdornment>
                            )
                        }}
                    />
                    <List
                        className={[
                            styles.results,
                            isDisabled && styles.active
                        ].join(' ')}
                    >
                        {results.map((result) => (
                            <ListItem
                                button
                                key={`${result.lat},${result.lng}`}
                                onClick={() => clickHandler(result)}
                            >
                                <ListItemText
                                    primary={result.name}
                                    secondary={result.address}
                                />
                            </ListItem>
                        ))}
                    </List>
                </form>
            </ClickAwayListener>
        </>
    )
}

export default Search
