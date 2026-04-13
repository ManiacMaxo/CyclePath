import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt'

export class AccessTokenConfigService implements JwtOptionsFactory {
    createJwtOptions(): JwtModuleOptions {
        return {
            secret: process.env.ACCESS_TOKEN_SECRET,
            signOptions: {
                expiresIn: '15m'
            }
        }
    }
}
