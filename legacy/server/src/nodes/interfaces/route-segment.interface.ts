import { INode } from "src/nodes/interfaces/node.interface";

export interface IRouteSegment {
    start: INode
    end: INode
    cost: number
    rating: number
}