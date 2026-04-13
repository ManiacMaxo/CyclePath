import { Search, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import useSWRMutation from 'swr/mutation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth'
import { searchPlaces } from '@/lib/api'
import type { SearchLocation } from '@/types/api'

type SearchBarProps = {
  onSelect: (location: SearchLocation) => void
  currentPosition: { lat: number; lng: number } | null
}

export default function SearchBar({
  onSelect,
  currentPosition,
}: SearchBarProps) {
  const { state } = useAuth()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { data, trigger, isMutating, reset } = useSWRMutation(
    'search',
    (
      _: string,
      {
        arg,
      }: {
        arg: {
          token: string
          query: string
          currentPosition: { lat: number; lng: number }
          locale: string
        }
      },
    ) => searchPlaces(arg.token, arg.query, arg.currentPosition, arg.locale),
    {
      onSuccess: () => {
        setIsOpen(true)
      },
      onError: () => {
        reset()
        setIsOpen(true)
      },
    },
  )
  const results = data?.slice(0, 5) ?? []

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  const handleSelect = (location: SearchLocation) => {
    setQuery(location.name)
    reset()
    setIsOpen(false)
    onSelect(location)
  }

  return (
    <div
      className='pointer-events-auto absolute inset-x-3 top-3 z-[1000] mx-auto max-w-xl'
      ref={containerRef}
    >
      <form
        className='relative'
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          const trimmedQuery = query.trim()

          if (!trimmedQuery || !currentPosition || !state?.token) {
            reset()
            setIsOpen(false)
            return
          }

          trigger({
            token: state.token,
            query: trimmedQuery,
            currentPosition,
            locale: navigator.language,
          })
        }}
      >
        <Input
          aria-label='Search for a destination'
          size='lg'
          className='rounded-2xl bg-white/95 pr-24 shadow-lg backdrop-blur dark:bg-card/95'
          onChange={(event) => {
            setQuery(event.target.value)
            if (!event.target.value.trim()) {
              reset()
              setIsOpen(false)
            }
          }}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder='Search places'
          type='search'
          value={query}
        />
        {query ? (
          <Button
            aria-label='Clear search'
            className='absolute right-11 top-1/2 -translate-y-1/2'
            onClick={() => {
              setQuery('')
              reset()
              setIsOpen(false)
            }}
            size='icon-sm'
            type='button'
            variant='ghost'
          >
            <X className='size-4' />
          </Button>
        ) : null}
        <Button
          aria-label='Search'
          className='absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl'
          loading={isMutating}
          size='icon-sm'
          type='submit'
          variant='secondary'
        >
          {!isMutating ? <Search className='size-4' /> : null}
        </Button>
      </form>

      {isOpen ? (
        <div className='mt-2 overflow-hidden rounded-2xl border bg-white/96 shadow-xl backdrop-blur dark:bg-card/96'>
          {isMutating ? (
            <div className='px-4 py-3 text-sm text-muted-foreground'>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className='max-h-80 overflow-y-auto py-1'>
              {results.map((location) => (
                <li
                  key={`${location.name}-${location.address}-${location.lat}-${location.lng}`}
                >
                  <button
                    className='flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-muted'
                    onClick={() => handleSelect(location)}
                    type='button'
                  >
                    <span className='text-sm font-medium text-foreground'>
                      {location.name}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {location.address}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className='px-4 py-3 text-sm text-muted-foreground'>
              No places found
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
