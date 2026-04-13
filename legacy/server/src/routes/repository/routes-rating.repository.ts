import { EntityRepository, Repository } from 'typeorm'
import { RateRouteDto } from '../dto/rate-route.dto'
import { RouteRating } from '../entities/route-rating.entity'
import { AVGRating } from '../interfaces/avg-rating.interface'

@EntityRepository(RouteRating)
export class RoutesRatingRepository extends Repository<RouteRating> {
    async createRouteRating(rateRouteDto: RateRouteDto, userId: number): Promise<RouteRating> {
        const routeRating: RouteRating = this.create({ ...rateRouteDto, userId })

        return this.save(routeRating)
    }

    async getAvgRatingForRoute(nodeOneId: number, nodeTwoId: number): Promise<number> {
        const avgRating: AVGRating = await this.createQueryBuilder('routeRating')
            .select('AVG(routeRating.rating)')
            .where('routeRating.nodeOneId = :nodeOneId', { nodeOneId })
            .andWhere('routeRating.nodeTwoId = :nodeTwoId', { nodeTwoId })
            .groupBy('routeRating.id')
            .getRawOne()

        return +avgRating?.avg
    }
}
