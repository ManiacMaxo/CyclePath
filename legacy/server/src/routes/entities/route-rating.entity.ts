import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class RouteRating {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'bigint' })
    nodeOneId: number

    @Column({ type: 'bigint' })
    nodeTwoId: number

    @Column()
    userId: number

    @Column()
    rating: number
}
