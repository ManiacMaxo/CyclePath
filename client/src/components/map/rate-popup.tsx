import { Star, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { RouteSegment } from '@/types/api'

type RatePopupProps = {
  segment: RouteSegment | null
  onClose: () => void
  onRate: (rating: number) => void
}

export default function RatePopup({
  segment,
  onClose,
  onRate,
}: RatePopupProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  if (!segment) {
    return null
  }

  const handleRate = (rating: number) => {
    setSelectedRating(rating)
    onRate(rating)
    toast.success(
      `You rated this segment ${rating} star${rating === 1 ? '' : 's'}`,
    )
    onClose()
  }

  return (
    <div className='pointer-events-none absolute inset-x-0 bottom-0 z-[1000] p-3'>
      <div className='pointer-events-auto mx-auto max-w-md rounded-[28px] border bg-background/96 p-4 shadow-2xl backdrop-blur'>
        <div className='mb-4 flex items-start justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold'>Rate this segment</h2>
            <p className='text-sm text-muted-foreground'>
              Help other riders discover better streets
            </p>
          </div>
          <Button onClick={onClose} size='icon-sm' variant='ghost'>
            <X className='size-4' />
          </Button>
        </div>

        <div className='grid grid-cols-5 gap-2'>
          {Array.from({ length: 5 }, (_, index) => {
            const rating = index + 1
            const active =
              selectedRating !== null ? rating <= selectedRating : false

            return (
              <Button
                className='h-12 rounded-2xl'
                key={rating}
                onClick={() => handleRate(rating)}
                variant={active ? 'default' : 'outline'}
              >
                <Star className={`size-5 ${active ? 'fill-current' : ''}`} />
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
