import { BottomNavigation, BottomNavigationAction } from '@material-ui/core'
import React, { useContext, useEffect, useState } from 'react'
import { AiOutlineHome } from 'react-icons/ai'
import { HiOutlineLogin } from 'react-icons/hi'
import { CgProfile } from 'react-icons/cg'
import { SiGooglemaps } from 'react-icons/si'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/Auth/AuthContext'
import { AuthContextInterface } from '../../context/Auth/AuthContext.interface'
import styles from './Nav.module.scss'

interface Props {}

const Nav: React.FC<Props> = () => {
    const navigator = useNavigate()

    const { pathname } = useLocation()

    const { authState } = useContext<AuthContextInterface>(AuthContext)

    const [navAction, setNavAction] = useState<string>(pathname)

    useEffect(() => navigator(navAction), [navAction])

    return (
        <BottomNavigation
            value={navAction}
            onChange={(e, newAction) => setNavAction(newAction)}
            className={styles.root}
        >
            <BottomNavigationAction
                label='Home'
                icon={<AiOutlineHome />}
                value='/'
            />
            {authState ? (
                <BottomNavigationAction
                    label='Map'
                    icon={<SiGooglemaps />}
                    value='/map'
                />
            ) : (
                <BottomNavigationAction
                    label='Login'
                    icon={<HiOutlineLogin />}
                    value='/login'
                />
            )}
            {authState ? (
                <BottomNavigationAction
                    label='Profile'
                    icon={<CgProfile />}
                    value='/profile'
                />
            ) : null}
        </BottomNavigation>
    )
}

export default Nav
