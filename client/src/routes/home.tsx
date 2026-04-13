import { ArrowRight, Bike, Leaf, MapPin, Star } from 'lucide-react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [, navigate] = useLocation()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/map')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-6 pb-24 text-center mx-auto max-w-lg'>
      <div className='bg-primary/10 p-6 rounded-full mb-8'>
        <Bike className='w-16 h-16 text-primary' />
      </div>

      <h1 className='text-5xl font-heading font-bold text-foreground mb-4 tracking-tight'>
        CyclePath
      </h1>

      <p className='text-lg text-muted-foreground mb-10'>
        Find the best cycling routes, optimized for safety and air quality.
      </p>

      <div className='flex flex-col gap-4 w-full mb-10'>
        <div className='flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm'>
          <div className='bg-primary/10 p-2 rounded-lg'>
            <MapPin className='w-6 h-6 text-primary' />
          </div>
          <div className='text-left'>
            <h3 className='font-semibold'>Smart Routing</h3>
            <p className='text-sm text-muted-foreground'>
              Optimized for cyclists
            </p>
          </div>
        </div>

        <div className='flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm'>
          <div className='bg-primary/10 p-2 rounded-lg'>
            <Leaf className='w-6 h-6 text-primary' />
          </div>
          <div className='text-left'>
            <h3 className='font-semibold'>Air Quality</h3>
            <p className='text-sm text-muted-foreground'>
              AQI data per segment
            </p>
          </div>
        </div>

        <div className='flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm'>
          <div className='bg-primary/10 p-2 rounded-lg'>
            <Star className='w-6 h-6 text-primary' />
          </div>
          <div className='text-left'>
            <h3 className='font-semibold'>Community Ratings</h3>
            <p className='text-sm text-muted-foreground'>
              Rate and improve routes
            </p>
          </div>
        </div>
      </div>

      <Button
        size='xl'
        className='w-full font-semibold'
        onClick={handleGetStarted}
      >
        Get Started <ArrowRight className='ml-2 w-5 h-5' />
      </Button>
    </div>
  )
}
