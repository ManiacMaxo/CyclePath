import { CircularProgress } from '@material-ui/core'
import React, { Suspense, useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.min.css'
import { Nav } from './components'
import { AuthContext, AuthContextInterface } from './context/Auth'
import { useRefreshToken } from './hooks'
import Error from './pages/Error'

const Home = React.lazy(() => import('./pages/Home'))
const Profile = React.lazy(() => import('./pages/Profile'))
const Login = React.lazy(() => import('./pages/Login'))
const Register = React.lazy(() => import('./pages/Register'))
const Map = React.lazy(() => import('./pages/Map'))

const App = () => {
    useRefreshToken()

    const { authState } = useContext<AuthContextInterface>(AuthContext)

    return (
        <>
            <Suspense fallback={<CircularProgress />}>
                <Routes>
                    <Route path='/' element={<Home />} />
                    {authState ? (
                        <>
                            <Route path='/map' element={<Map />} />
                            <Route path='/profile' element={<Profile />} />
                        </>
                    ) : (
                        <>
                            <Route path='/login' element={<Login />} />
                            <Route path='/register' element={<Register />} />
                        </>
                    )}
                    <Route path='*' element={<Error />} />
                </Routes>
            </Suspense>
            <Nav />
        </>
    )
}

export default App
