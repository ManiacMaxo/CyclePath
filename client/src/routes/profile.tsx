import { ChevronRight, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'

export default function ProfilePage() {
  const [, navigate] = useLocation()
  const { signOut } = useAuth()

  const handleSignOut = () => {
    signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className='flex flex-col items-center min-h-screen p-6 pb-24 mx-auto max-w-lg w-full pt-12'>
      <div className='w-full space-y-8'>
        <div className='flex flex-col items-center justify-center space-y-4 mb-10'>
          <div className='bg-primary/10 p-6 rounded-full'>
            <User className='w-16 h-16 text-primary' />
          </div>
          <h1 className='text-3xl font-heading font-bold text-foreground'>
            Profile
          </h1>
        </div>

        <div className='space-y-4 w-full'>
          <div className='bg-card rounded-xl border shadow-sm overflow-hidden'>
            <button
              type='button'
              className='w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors'
            >
              <div className='flex items-center gap-3'>
                <User className='w-5 h-5 text-muted-foreground' />
                <span className='font-medium'>Account Settings</span>
              </div>
              <ChevronRight className='w-5 h-5 text-muted-foreground' />
            </button>
            <div className='h-px bg-border' />
            <button
              type='button'
              className='w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors'
            >
              <div className='flex items-center gap-3'>
                <span className='font-medium pl-8'>Privacy & Security</span>
              </div>
              <ChevronRight className='w-5 h-5 text-muted-foreground' />
            </button>
          </div>

          <Button
            variant='outline'
            className='w-full font-semibold mt-8 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10'
            size='lg'
            onClick={handleSignOut}
          >
            <LogOut className='mr-2 w-4 h-4' /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
