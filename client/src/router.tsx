import { lazy, Suspense } from 'react'
import { Route, Switch, Router as Wouter } from 'wouter'
import { AppShell } from '@/components/layout/app-shell'
import { Spinner } from '@/components/ui/spinner'

const HomePage = lazy(() => import('@/routes/home'))
const LoginPage = lazy(() => import('@/routes/login'))
const RegisterPage = lazy(() => import('@/routes/register'))
const ProfilePage = lazy(() => import('@/routes/profile'))
const MapPage = lazy(() => import('@/routes/map'))

function RouterFallback() {
  return (
    <div className='flex min-h-dvh items-center justify-center px-4'>
      <Spinner className='size-6 text-primary' />
    </div>
  )
}

export default function Router() {
  return (
    <Wouter>
      <AppShell>
        <Suspense fallback={<RouterFallback />}>
          <Switch>
            <Route path='/' component={HomePage} />
            <Route path='/login' component={LoginPage} />
            <Route path='/register' component={RegisterPage} />
            <Route path='/profile' component={ProfilePage} />
            <Route path='/map' component={MapPage} />
          </Switch>
        </Suspense>
      </AppShell>
    </Wouter>
  )
}
