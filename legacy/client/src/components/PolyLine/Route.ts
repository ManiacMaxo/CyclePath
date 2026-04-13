export interface Route {
    start: Point
    end: Point
    cost: number
    rating: number
}

interface Point {
    lat: number
    long: number
    nodeId: number
}
