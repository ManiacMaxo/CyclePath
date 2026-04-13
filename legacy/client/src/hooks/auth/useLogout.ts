import { useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/Auth/AuthContext'
import { AuthContextInterface } from '../../context/Auth/AuthContext.interface'
import { AuthContextState } from '../../context/Auth/AuthContextState'

interface LogoutState {
    logout: () => void
    authState: AuthContextState | null
}

export const useLogout = (): LogoutState => {
    const { setAuthState, authState } =
        useContext<AuthContextInterface>(AuthContext)

    const navigator = useNavigate()

    const logout = useCallback(async () => {
        if (!authState?.token) {
            return
        }

        await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authState?.token}`
            }
        })

        setAuthState(null)
        navigator('/')
    }, [authState?.token, setAuthState])

    return { logout, authState }
}
