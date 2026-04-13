import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { Strategy } from 'passport-jwt'
import { REFRESH_TOKEN, REFRESH_TOKEN_COOKIE_NAME } from 'src/constants'
import { RefreshTokenPayload } from 'src/refresh-token/interface/RefreshTokenPayload'
import { User } from 'src/users/entity/user.entity'
import { UsersService } from 'src/users/users.service'

const extractRefreshTokenFromCookie = (req: Request): string => {
    const token: string = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

    if (!token) {
        throw new BadRequestException()
    }

    return token
}

@Injectable()
export class RefreshTokenStartegy extends PassportStrategy(Strategy, REFRESH_TOKEN) {
    constructor(private readonly userService: UsersService) {
        super({
            jwtFromRequest: extractRefreshTokenFromCookie,
            secretOrKey: process.env.REFRESH_TOKEN_SECRET
        })
    }

    async validate(payload: RefreshTokenPayload): Promise<User> {
        const user: User = await this.userService.findById(payload.id)

        return user
    }
}
