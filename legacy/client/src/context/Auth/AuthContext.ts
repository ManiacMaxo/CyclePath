import React from 'react'
import { AuthContextInterface } from './AuthContext.interface'

export const AuthContext = React.createContext<AuthContextInterface>({
    authState: null,
    setAuthState: () => {}
})
