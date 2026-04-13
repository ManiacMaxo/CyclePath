import { Injectable } from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import { JwtService } from '@nestjs/jwt'
import { CreateUserDto } from './dto/create-user.dto'
import { AuthTokens } from './interfaces/auth-tokens.interface'
import { User } from 'src/users/entity/user.entity'
import { AuthUserDto } from './dto/auth-user.dto'
import { JwtPayload } from './interfaces/jwt-payload.interface'
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service'

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly refreshTokenService: RefreshTokenService
    ) {}

    async signUp(createUserDto: CreateUserDto): Promise<AuthTokens> {
        const user: User = await this.usersService.create(createUserDto)

        return this.getTokens(user)
    }

    async signIn(authUserDto: AuthUserDto): Promise<AuthTokens> {
        const user: User = await this.usersService.findAuthUser(authUserDto)

        return this.getTokens(user)
    }

    getTokens(user: User): AuthTokens {
        return {
            token: this.signToken(user.id),
            refreshToken: this.refreshTokenService.signToken({
                id: user.id
            })
        }
    }

    private signToken(id: number): string {
        const payload: JwtPayload = { id }

        return this.jwtService.sign(payload)
    }
}
