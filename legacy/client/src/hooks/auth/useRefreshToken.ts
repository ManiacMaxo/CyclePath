import decode from 'jwt-decode'
import { useCallback, useContext, useEffect } from 'react'
import { AuthContext } from '../../context/Auth/AuthContext'
import { AuthContextInterface } from '../../context/Auth/AuthContext.interface'
import { DecodedToken } from '../../tokenTypes/DecodedToken'
import { TokenResponse } from '../../tokenTypes/TokenResponse'

export const useRefreshToken = () => {
    const { setAuthState, authState } = useContext<AuthContextInterface>(
        AuthContext
    )

    const fetchData = useCallback(async () => {
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )

        if (!response.ok) return

        const data: TokenResponse = await response.json()
        const { exp, id }: DecodedToken = decode(data.token)

        setAuthState({
            exp: exp * 1000 - Date.now(),
            token: data.token,
            userId: id
        })
    }, [setAuthState])

    useEffect(() => {
        if (!authState) {
            fetchData()
            return
        }

        const timer: NodeJS.Timeout = setTimeout(() => {
            fetchData()
        }, authState.exp)

        return () => clearTimeout(timer)
    }, [authState, fetchData])
}
