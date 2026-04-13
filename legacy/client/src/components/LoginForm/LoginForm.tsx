import { Typography } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import React from 'react'
import styles from './LoginForm.module.scss'

interface Props {
    email: string
    password: string
    handleEmail: (e: React.ChangeEvent<HTMLInputElement>) => void
    handlePassword: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleLogin: (event: React.FormEvent<HTMLFormElement>) => void
}

const LoginForm: React.FC<Props> = (props) => {
    return (
        <form className={styles.root} onSubmit={props.handleLogin}>
            <Typography variant='h4' component='h1'>
                Login
            </Typography>
            <TextField
                className={styles.inputs}
                fullWidth
                variant='outlined'
                label='Email'
                size='small'
                value={props.email}
                onChange={props.handleEmail}
            />
            <TextField
                className={styles.inputs}
                fullWidth
                type='password'
                variant='outlined'
                label='Password'
                size='small'
                value={props.password}
                onChange={props.handlePassword}
            />
            <Button
                className={styles.button}
                fullWidth
                variant='contained'
                color='primary'
                type='submit'
            >
                Login
            </Button>
        </form>
    )
}

export default LoginForm
