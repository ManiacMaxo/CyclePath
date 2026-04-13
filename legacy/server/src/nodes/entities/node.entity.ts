import { Node as Neo4JNode, int, integer } from 'neo4j-driver'
import { INode } from '../interfaces/node.interface'

interface NeoIntegerRepresentation {
    low: number
    high: number
}

export class Node {
    public nodeId: number | string

    constructor(
        public readonly lat: number,
        public readonly long: number,
        nodeId?: NeoIntegerRepresentation
    ) {
        this.nodeId = nodeId !== undefined ? this.calculateNeoInt(nodeId) : -1
    }

    private calculateNeoInt(neoInt: NeoIntegerRepresentation): number | string {
        const parsedNeoInt = int(neoInt)
        if (integer.inSafeRange(parsedNeoInt)) {
            return parsedNeoInt.toNumber()
        }
        console.log(parsedNeoInt.toString(10))

        return parsedNeoInt.toString(10)
    }

    toJSON(): INode {
        return {
            lat: this.lat,
            long: this.long,
            nodeId: this.nodeId
        }
    }
}
