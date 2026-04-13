import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt'

export class RefreshTokenConfigService implements JwtOptionsFactory {
    createJwtOptions(): JwtModuleOptions {
        return {
            secret: process.env.REFRESH_TOKEN_SECRET,
            signOptions: {
                expiresIn: '7d'
            }
        }
    }
}
