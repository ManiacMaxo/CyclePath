import { Injectable } from '@nestjs/common'
import { Node } from './entities/node.entity'
import { NodesRepository } from './repository/nodes.repository'

@Injectable()
export class NodesService {

    private nodes: Node[];

    constructor(private readonly nodesRepository: NodesRepository) {}

    async getAllNodes() {
        if (this.nodes === undefined) {
            this.nodes = await  this.nodesRepository.getAllNodes()
        }

        return this.nodes
    }
}
