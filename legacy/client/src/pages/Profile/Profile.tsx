import { Button } from '@material-ui/core'
import React from 'react'
import { ImExit } from 'react-icons/im'
import { useLogout } from '../../hooks'

interface Props {}

const Profile: React.FC<Props> = () => {
    const { logout } = useLogout()

    return (
        <div className='centered'>
            <Button
                variant='contained'
                color='primary'
                size='large'
                endIcon={<ImExit />}
                onClick={logout}
            >
                Logout
            </Button>
        </div>
    )
}

export default Profile
