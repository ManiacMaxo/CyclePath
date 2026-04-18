import type {
  AirPollutionRequest,
  AirPollutionResponse,
  AuthSignInRequest,
  AuthSignUpRequest,
  AuthTokenResponse,
  DebugGraphResponse,
  ErrorResponse,
  RoutesGetResponse,
  RoutesRateRequest,
  SearchLocation,
} from '@/types/api'

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object
  getToken?: () => string | null | undefined
}

const JSON_CONTENT_TYPE = 'application/json'

const isObjectBody = (body: ApiFetchOptions['body']): body is object => {
  return (
    typeof body === 'object' && body !== null && !(body instanceof FormData)
  )
}

const parseErrorResponse = async (
  response: Response,
): Promise<ErrorResponse> => {
  const fallbackError: ErrorResponse = {
    statusCode: response.status,
    message: response.statusText || 'Request failed',
  }

  try {
    const errorResponse = (await response.json()) as ErrorResponse

    return {
      statusCode: errorResponse.statusCode ?? fallbackError.statusCode,
      message: errorResponse.message ?? fallbackError.message,
      error: errorResponse.error,
    }
  } catch {
    return fallbackError
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, getToken, headers, method, ...restOptions } = options
  const normalizedMethod = method?.toUpperCase()
  const token = getToken?.()
  const requestHeaders = new Headers(headers)

  if (
    (normalizedMethod === 'POST' || normalizedMethod === 'PUT') &&
    !requestHeaders.has('Content-Type')
  ) {
    requestHeaders.set('Content-Type', JSON_CONTENT_TYPE)
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, {
    ...restOptions,
    method,
    headers: requestHeaders,
    body: isObjectBody(body) ? JSON.stringify(body) : body,
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth-token')
      window.dispatchEvent(new CustomEvent('auth:token-expired'))
    }

    throw await parseErrorResponse(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function signIn(email: string, password: string) {
  const body: AuthSignInRequest = { email, password }

  return apiFetch<AuthTokenResponse>('/api/auth/sign-in', {
    method: 'POST',
    body,
  })
}

export function signUp(name: string, email: string, password: string) {
  const body: AuthSignUpRequest = { name, email, password }

  return apiFetch<AuthTokenResponse>('/api/auth/sign-up', {
    method: 'POST',
    body,
  })
}

export function refreshToken(token: string) {
  return apiFetch<AuthTokenResponse>('/api/auth/refresh-token', {
    method: 'POST',
    credentials: 'include',
    getToken: () => token,
  })
}

export function searchPlaces(
  token: string,
  query: string,
  location: { lat: number; lng: number },
  locale?: string,
) {
  const searchParams = new URLSearchParams({
    query,
    location: `${location.lat},${location.lng}`,
  })

  if (locale) {
    searchParams.set('locale', locale)
  }

  return apiFetch<SearchLocation[]>(`/api/search?${searchParams.toString()}`, {
    getToken: () => token,
  })
}

export function getRoutes(
  token: string,
  startNodeLat: number,
  startNodeLong: number,
  endNodeLat: number,
  endNodeLong: number,
) {
  const searchParams = new URLSearchParams({
    startNodeLat: String(startNodeLat),
    startNodeLong: String(startNodeLong),
    endNodeLat: String(endNodeLat),
    endNodeLong: String(endNodeLong),
  })

  return apiFetch<RoutesGetResponse>(`/api/routes?${searchParams.toString()}`, {
    getToken: () => token,
  })
}

export function getAirPollution(
  token: string,
  segments: AirPollutionRequest[],
) {
  return apiFetch<AirPollutionResponse[]>('/api/routes/air-pollution', {
    method: 'POST',
    body: segments,
    getToken: () => token,
  })
}

export function rateSegment(
  token: string,
  nodeOneId: number,
  nodeTwoId: number,
  rating: number,
) {
  const body: RoutesRateRequest = {
    nodeOneId,
    nodeTwoId,
    rating,
  }

  return apiFetch<void>('/api/routes/rate', {
    method: 'POST',
    body,
    getToken: () => token,
  })
}

export function getDebugGraph(
  token: string,
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
) {
  const searchParams = new URLSearchParams({
    minLat: String(minLat),
    maxLat: String(maxLat),
    minLng: String(minLng),
    maxLng: String(maxLng),
  })

  return apiFetch<DebugGraphResponse>(`/api/debug/graph?${searchParams.toString()}`, {
    getToken: () => token,
  })
}
