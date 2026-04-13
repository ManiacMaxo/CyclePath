import React from 'react'
import { AuthContextState } from './AuthContextState'

export interface AuthContextInterface {
    authState: AuthContextState | null
    setAuthState: React.Dispatch<React.SetStateAction<AuthContextState | null>>
}
