import { Box, Typography } from '@material-ui/core'
import React from 'react'

interface Props {}

const Home: React.FC<Props> = () => {
    return (
        <Box
            display='flex'
            flexDirection='column'
            justifyContent='center'
            alignItems='center'
            p='0 2rem 8rem 2rem'
            width='100%'
            height='100%'
        >
            <Box maxWidth='400px'>
                <img
                    style={{ width: '100%' }}
                    alt='Home Banner'
                    src='images/eco_bike.webp'
                />
            </Box>
            <Typography variant='subtitle1' component='h1' color='primary'>
                Take a ride
                <br />
                on the green side
            </Typography>
            <Box
                component='blockquote'
                bgcolor='#ffc40075'
                borderLeft='7px solid #ffc400'
                maxWidth='500px'
                marginTop='1rem'
                p='1.25rem 1.7rem'
            >
                <Typography component='p'>
                    &#x26a0; Unfortunately, due to the limitations of our
                    server, we are unable to supply a map of Sofia. However you
                    will be able to try our product on a map of Monaco with a
                    default location.
                </Typography>
            </Box>
        </Box>
    )
}

export default Home
