export class GetRouteDto {
    constructor(
        public startNodeLat: number,
        public startNodeLong: number,
        public endNodeLat: number,
        public endNodeLong: number) {}
}