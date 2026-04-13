import { IRouteSegment } from '../interfaces/route-segment.interface'
import { Node } from './node.entity'

export class RouteSegment {
    constructor(public start: Node, public end: Node, public cost: number, public rating: number = 4) {}

    toJSON(): IRouteSegment {
        return {
            start: this.start.toJSON(),
            end: this.end.toJSON(),
            cost: this.cost,
            rating: this.rating
        }
    }
}
