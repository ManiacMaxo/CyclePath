import { Link, Typography } from '@material-ui/core'
import decode from 'jwt-decode'
import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { RegisterForm } from '../../components'
import { AuthContext, AuthContextInterface } from '../../context/Auth'
import { DecodedToken } from '../../tokenTypes/DecodedToken'

const Register: React.FC = () => {
    const [name, setName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    const { setAuthState } = useContext<AuthContextInterface>(AuthContext)

    const navigator = useNavigate()

    const register = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        fetch(`${process.env.REACT_APP_API_URL}/auth/sign-up`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message) {
                    toast.error(data.message[0])
                    return
                } else {
                    const { exp, id }: DecodedToken = decode(data.token)
                    setAuthState({
                        exp: exp * 1000 - Date.now(),
                        token: data.token,
                        userId: id
                    })
                    toast.success('Successful!')
                    navigator('/')
                }
            })
    }

    return (
        <div className='centered'>
            <RegisterForm
                name={name}
                email={email}
                password={password}
                handleName={(e) => setName(e.target.value)}
                handleEmail={(e) => setEmail(e.target.value)}
                handlePassword={(e) => setPassword(e.target.value)}
                handleRegister={register}
            />
            <Typography variant='subtitle2' component='span'>
                Already have an account? <Link href='/login'>Login!</Link>
            </Typography>
        </div>
    )
}

export default Register
