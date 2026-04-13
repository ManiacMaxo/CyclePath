import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { RefreshTokenConfigService } from 'src/config/refresh-token-config.service'
import { RefreshTokenService } from './refresh-token.service'

@Module({
    imports: [
        JwtModule.registerAsync({ useClass: RefreshTokenConfigService }),
        PassportModule.register({ defaultStrategy: 'jwt' })
    ],
    providers: [RefreshTokenService],
    exports: [RefreshTokenService]
})
export class RefreshTokenModule {}
