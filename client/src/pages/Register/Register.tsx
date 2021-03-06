import { Link, Typography } from '@material-ui/core'
import decode from 'jwt-decode'
import React, { useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { toast } from 'react-toastify'
import { RegisterForm } from '../../components'
import { AuthContext, AuthContextInterface } from '../../context/Auth'
import { DecodedToken } from '../../tokenTypes/DecodedToken'

interface Props {}

const Register: React.FC<Props> = () => {
    const [name, setName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    const { setAuthState } = useContext<AuthContextInterface>(AuthContext)

    let history = useHistory()

    const register = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        await fetch(`${process.env.REACT_APP_API_URL}/auth/sign-up`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
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
                    history.push('/')
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
