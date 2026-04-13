export type RouteNode = {
  id: number
  lat: number
  long: number
}

export type RouteSegment = {
  start: RouteNode
  end: RouteNode
  cost: number
  rating: number
}

export type RoutesGetResponse = {
  best: RouteSegment[]
  shortest: RouteSegment[]
}

export type RoutesRateRequest = {
  nodeOneId: number
  nodeTwoId: number
  rating: number
}

export type AirPollutionRequest = {
  startLat: number
  startLon: number
  endLat: number
  endLon: number
}

export type AirPollutionResponse = {
  measurementTime: string
  pollutionIndex: number
}

export type SearchLocation = {
  lat: number
  lng: number
  name: string
  address: string
}

export type AuthSignInRequest = {
  email: string
  password: string
}

export type AuthSignUpRequest = {
  name: string
  email: string
  password: string
}

export type AuthTokenResponse = {
  token: string
}

export type ErrorResponse = {
  statusCode: number
  message: string
  error?: string
}
