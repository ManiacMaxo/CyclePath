import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWRMutation from 'swr/mutation'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth'
import { signUp } from '@/lib/api'

export default function RegisterPage() {
  const [, navigate] = useLocation()
  const { signIn: authSignIn } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { trigger, isMutating } = useSWRMutation(
    'auth/sign-up',
    (
      _: string,
      { arg }: { arg: { name: string; email: string; password: string } },
    ) => signUp(arg.name, arg.email, arg.password),
    {
      onSuccess: ({ token }) => {
        authSignIn(token)
        toast.success('Account created successfully!')
        navigate('/map')
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : 'Failed to create account.',
        )
      },
    },
  )

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-6 pb-24 mx-auto max-w-sm w-full'>
      <div className='w-full space-y-8'>
        <div className='text-center space-y-2'>
          <h1 className='text-4xl font-heading font-bold text-foreground'>
            Create Account
          </h1>
          <p className='text-muted-foreground'>
            Sign up to save and rate routes
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()

            if (!name || !email || !password) {
              toast.error('Please fill out all fields.')
              return
            }

            trigger({ name, email, password })
          }}
          className='space-y-6'
        >
          <div className='space-y-4'>
            <div className='space-y-2'>
              <label
                htmlFor='name'
                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                Name
              </label>
              <Input
                id='name'
                type='text'
                placeholder='Your Name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                nativeInput={false}
              />
            </div>
            <div className='space-y-2'>
              <label
                htmlFor='email'
                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                Email
              </label>
              <Input
                id='email'
                type='email'
                placeholder='m@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                nativeInput={false}
              />
            </div>
            <div className='space-y-2'>
              <label
                htmlFor='password'
                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                Password
              </label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                nativeInput={false}
              />
            </div>
          </div>

          <Button
            type='submit'
            className='w-full font-semibold'
            size='lg'
            loading={isMutating}
            disabled={isMutating}
          >
            Sign Up <ArrowRight className='ml-2 w-4 h-4' />
          </Button>
        </form>

        <div className='text-center text-sm text-muted-foreground'>
          Already have an account?{' '}
          <button
            type='button'
            onClick={() => navigate('/login')}
            className='text-primary underline-offset-4 hover:underline font-medium'
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
