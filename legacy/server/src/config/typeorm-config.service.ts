import { Injectable } from '@nestjs/common'
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm'

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
    createTypeOrmOptions(): TypeOrmModuleOptions {
        const inProd = process.env.NODE_ENV === 'production'

        return {
            type: 'postgres',
            host: process.env.PG_HOST,
            port: Number(process.env.PG_PORT),
            username: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
            database: process.env.PG_DB,
            dropSchema: false,
            synchronize: !inProd,
            logging: !inProd,
            entities: [__dirname + '/../**/*.entity.{js,ts}']
        }
    }
}
