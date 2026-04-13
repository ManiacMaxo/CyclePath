import { Box, Typography } from '@material-ui/core'
import React from 'react'

interface Props {}

const Error: React.FC<Props> = (props) => {
    return (
        <Box className='centered'>
            <Typography component='h1' variant='h1'>
                404
            </Typography>
            <Typography component='span'>Page not found</Typography>
        </Box>
    )
}

export default Error
