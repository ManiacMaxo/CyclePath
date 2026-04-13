import type { PropsWithChildren } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type AuthState = {
  token: string
  userId: number
  exp: number
} | null

type AuthContextValue = {
  state: AuthState
  signIn: (token: string) => void
  signOut: () => void
  isAuthenticated: boolean
}

type JwtPayload = {
  userId: number
  exp: number
}

const AUTH_TOKEN_STORAGE_KEY = 'auth-token'

const AuthContext = createContext<AuthContextValue | null>(null)

const decodeJwtPayload = (token: string): JwtPayload => {
  const [, payload] = token.split('.')

  if (!payload) {
    throw new Error('Invalid JWT token payload')
  }

  const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
  const paddedPayload = normalizedPayload.padEnd(
    normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
    '=',
  )
  const decodedPayload = atob(paddedPayload)

  return JSON.parse(decodedPayload) as JwtPayload
}

const TOKEN_EXPIRED_EVENT = 'auth:token-expired'

const isTokenExpired = (exp: number): boolean => {
  return Date.now() >= exp * 1000
}

const createAuthState = (token: string): Exclude<AuthState, null> => {
  const payload = decodeJwtPayload(token)

  if (payload.exp && isTokenExpired(payload.exp)) {
    throw new Error('Token is expired')
  }

  return {
    token,
    userId: payload.userId,
    exp: payload.exp,
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(null)

  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    setState(null)
  }, [])

  const signIn = useCallback((token: string) => {
    const nextState = createAuthState(token)

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    setState(nextState)
  }, [])

  // Restore token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

    if (!savedToken) {
      return
    }

    try {
      setState(createAuthState(savedToken))
    } catch {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
      setState(null)
    }
  }, [])

  // Periodically check token expiration (every 30s)
  useEffect(() => {
    if (!state) return

    const id = window.setInterval(() => {
      if (state.exp && isTokenExpired(state.exp)) {
        signOut()
      }
    }, 30_000)

    return () => window.clearInterval(id)
  }, [state, signOut])

  // Listen for 401 responses from the API layer
  useEffect(() => {
    const handler = () => signOut()

    window.addEventListener(TOKEN_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(TOKEN_EXPIRED_EVENT, handler)
  }, [signOut])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      signIn,
      signOut,
      isAuthenticated: state !== null,
    }),
    [signIn, signOut, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
