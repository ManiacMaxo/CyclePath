import { forwardRef, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AccessTokenConfigService } from 'src/config/access-token-config.service'
import { RefreshTokenModule } from 'src/refresh-token/refresh-token.module'
import { UsersModule } from 'src/users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategy/jwt-auth.strategy'
import { RefreshTokenStartegy } from './strategy/refresh-token.strategy'

@Module({
    imports: [
        JwtModule.registerAsync({ useClass: AccessTokenConfigService }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        forwardRef(() => RefreshTokenModule),
        UsersModule
    ],
    providers: [AuthService, JwtStrategy, RefreshTokenStartegy],
    controllers: [AuthController],
    exports: [JwtStrategy, AuthService]
})
export class AuthModule {}
