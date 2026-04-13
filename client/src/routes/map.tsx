import { Navigation, Route, Wind } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import { toast } from 'sonner'
import useSWR, { mutate } from 'swr'
import useSWRMutation from 'swr/mutation'
import AirPollution from '@/components/map/air-pollution'
import LongPressMarker from '@/components/map/long-press-marker'
import LocationMarker from '@/components/map/location-marker'
import MapView from '@/components/map/map-view'
import RatePopup from '@/components/map/rate-popup'
import RouteLine from '@/components/map/route-line'
import SearchBar from '@/components/map/search-bar'
import { useLongPress } from '@/components/map/use-long-press'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuthRedirect } from '@/hooks/use-auth'
import { getAirPollution, getRoutes, rateSegment } from '@/lib/api'
import type {
  AirPollutionRequest,
  AirPollutionResponse,
  RouteSegment,
  RoutesGetResponse,
  SearchLocation,
} from '@/types/api'

function UserPositionMarker({
  position,
}: {
  position: [number, number] | null
}) {
  if (!position) {
    return null
  }

  return (
    <Marker position={position}>
      <Popup>Your location</Popup>
    </Marker>
  )
}

function MapViewport({
  center,
  destination,
}: {
  center: [number, number] | null
  destination: [number, number] | null
}) {
  const map = useMap()

  useEffect(() => {
    if (center && destination) {
      map.fitBounds([center, destination], {
        padding: [48, 48],
      })
      return
    }

    if (center) {
      map.flyTo(center, 14, { duration: 0.75 })
    }
  }, [center, destination, map])

  return null
}

function LongPressHandler({
  onLongPress,
  onShortClick,
}: {
  onLongPress: (lat: number, lng: number) => void
  onShortClick: () => void
}) {
  const map = useMap()

  useLongPress(map, onLongPress, { onShortClick })

  return null
}

export default function MapPage() {
  const { state } = useAuthRedirect()
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null,
  )
  const [destination, setDestination] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [activeRoute, setActiveRoute] = useState<'best' | 'shortest'>('best')
  const [showPollution, setShowPollution] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(
    null,
  )
  const [longPressPosition, setLongPressPosition] = useState<
    [number, number] | null
  >(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude])
      },
      () => {
        toast.error('Unable to access your location')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }, [])

  const routesQueryKey = useMemo(() => {
    if (!destination || !userPosition || !state?.token) {
      return null
    }

    return [
      'routes',
      userPosition[0],
      userPosition[1],
      destination.lat,
      destination.lng,
    ]
  }, [destination, state?.token, userPosition])

  const { data: routes, isLoading: isLoadingRoutes } = useSWR<RoutesGetResponse>(
    routesQueryKey,
    () =>
      getRoutes(
        state!.token,
        userPosition![0],
        userPosition![1],
        destination!.lat,
        destination!.lng,
      ),
  )

  const activeSegments = useMemo(() => {
    if (!routes) {
      return []
    }

    return routes[activeRoute] ?? []
  }, [activeRoute, routes])

  const pollutionQueryKey = useMemo(() => {
    if (!showPollution || !state?.token || activeSegments.length === 0) {
      return null
    }

    return [
      'pollution',
      activeSegments.map((segment) => `${segment.start.id}-${segment.end.id}`).join(','),
    ]
  }, [activeSegments, showPollution, state?.token])

  const pollutionRequests = useMemo((): AirPollutionRequest[] => {
    return activeSegments.map((seg) => ({
      startLat: seg.start.lat,
      startLon: seg.start.long,
      endLat: seg.end.lat,
      endLon: seg.end.long,
    }))
  }, [activeSegments])

  const {
    data: pollutionData,
    isLoading: isLoadingPollution,
  } = useSWR<AirPollutionResponse[]>(pollutionQueryKey, () =>
    getAirPollution(state!.token, pollutionRequests),
  )

  const { trigger: rateSegmentTrigger } = useSWRMutation(
    'rate-segment',
    async (_key, { arg }: { arg: { segment: RouteSegment; rating: number } }) => {
      const { segment, rating } = arg
      return rateSegment(state!.token, segment.start.id, segment.end.id, rating)
    },
  )

  useEffect(() => {
    if (routes) {
      setActiveRoute('best')
    }
  }, [routes])

  useEffect(() => {
    if (destination) {
      setLongPressPosition(null)
    }
  }, [destination])

  const handleDestinationSelect = (location: SearchLocation) => {
    setLongPressPosition(null)
    setDestination({ lat: location.lat, lng: location.lng })
  }

  const handleLongPress = (lat: number, lng: number) => {
    setLongPressPosition([lat, lng])
  }

  const handleLongPressSelect = (lat: number, lng: number) => {
    setDestination({ lat, lng })
    setLongPressPosition(null)
  }

  const handleLongPressClear = () => {
    setLongPressPosition(null)
  }

  const handleRate = async (rating: number) => {
    if (!selectedSegment || !state?.token) {
      return
    }

    try {
      await rateSegmentTrigger({ segment: selectedSegment, rating })
      toast.success(`You rated this segment ${rating} star${rating === 1 ? '' : 's'}`)
      setSelectedSegment(null)
      mutate(
        (key) => typeof key === 'object' && Array.isArray(key) && key[0] === 'routes',
        undefined,
        { revalidate: true },
      )
    } catch {
      toast.error('Could not submit your rating')
    }
  }

  return (
    <div className='relative h-dvh w-full overflow-hidden bg-muted'>
      <MapView>
        <MapViewport
          center={userPosition}
          destination={destination ? [destination.lat, destination.lng] : null}
        />
        <LongPressHandler
          onLongPress={handleLongPress}
          onShortClick={handleLongPressClear}
        />
        <UserPositionMarker position={userPosition} />
        <LocationMarker
          end={destination ? [destination.lat, destination.lng] : null}
          start={userPosition}
        />

        {routes ? (
          <>
            <RouteLine
              active={activeRoute === 'best'}
              onSegmentClick={setSelectedSegment}
              segments={routes.best}
            />
            <RouteLine
              active={activeRoute === 'shortest'}
              onSegmentClick={setSelectedSegment}
              segments={routes.shortest}
            />
          </>
        ) : null}

        {showPollution ? (
          <AirPollution data={pollutionData ?? []} segments={activeSegments} />
        ) : null}

        <LongPressMarker
          onClear={handleLongPressClear}
          onSelect={handleLongPressSelect}
          position={longPressPosition}
        />
      </MapView>

      <SearchBar
        currentPosition={
          userPosition ? { lat: userPosition[0], lng: userPosition[1] } : null
        }
        onSelect={handleDestinationSelect}
      />

      {isLoadingRoutes ? (
        <div className='pointer-events-none absolute inset-0 z-[900] flex items-center justify-center bg-background/35 backdrop-blur-[2px]'>
          <div className='flex items-center gap-3 rounded-2xl bg-background/95 px-4 py-3 shadow-lg'>
            <Spinner className='size-5 text-primary' />
            <span className='text-sm font-medium'>Finding routes...</span>
          </div>
        </div>
      ) : null}

      <div className='pointer-events-none absolute bottom-24 right-3 z-[1000] flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2'>
        <Button
          className='pointer-events-auto rounded-full bg-background/96 px-4 shadow-lg backdrop-blur'
          disabled={!routes}
          onClick={() =>
            setActiveRoute((currentRoute) =>
              currentRoute === 'best' ? 'shortest' : 'best',
            )
          }
          size='sm'
          variant='outline'
        >
          <Route className='size-4' />
          {activeRoute === 'best' ? 'Best' : 'Shortest'}
        </Button>

        <Button
          className='pointer-events-auto rounded-full bg-background/96 px-4 shadow-lg backdrop-blur'
          disabled={!routes}
          loading={isLoadingPollution}
          onClick={() => setShowPollution((currentValue) => !currentValue)}
          size='sm'
          variant={showPollution ? 'default' : 'outline'}
        >
          {!isLoadingPollution ? <Wind className='size-4' /> : null}
          {showPollution ? 'Hide AQI' : 'Show AQI'}
        </Button>
      </div>

      {!userPosition ? (
        <div className='pointer-events-none absolute inset-x-3 bottom-3 z-[950] flex justify-center'>
          <div className='flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm shadow-lg backdrop-blur'>
            <Navigation className='size-4 text-primary' />
            Waiting for your location
          </div>
        </div>
      ) : null}

      <RatePopup
        onClose={() => setSelectedSegment(null)}
        onRate={handleRate}
        segment={selectedSegment}
      />
    </div>
  )
}
