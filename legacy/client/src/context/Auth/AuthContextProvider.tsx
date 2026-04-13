import React, { useState } from 'react'
import { AuthContext } from './AuthContext'
import { AuthContextState } from './AuthContextState'

interface Props {
    children: React.ReactNode
}

export const AuthContextProvider: React.FC<Props> = (props) => {
    const [authState, setAuthState] = useState<AuthContextState | null>(null)

    return (
        <AuthContext.Provider value={{ authState, setAuthState }}>
            {props.children}
        </AuthContext.Provider>
    )
}
