import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth as useAuthContext } from '@/context/auth'

export function useAuth() {
  return useAuthContext()
}

export function useToken() {
  const { state } = useAuthContext()

  return state?.token ?? null
}

export function useAuthRedirect() {
  const auth = useAuthContext()
  const [, navigate] = useLocation()

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/login')
    }
  }, [auth.isAuthenticated, navigate])

  return auth
}
