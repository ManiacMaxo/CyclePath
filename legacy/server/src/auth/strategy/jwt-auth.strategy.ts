import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AUTH } from 'src/constants'
import { User } from 'src/users/entity/user.entity'
import { UsersService } from 'src/users/users.service'

import { JwtPayload } from '../interfaces/jwt-payload.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AUTH) {
    constructor(private readonly userService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.ACCESS_TOKEN_SECRET
        })
    }

    async validate(payload: JwtPayload): Promise<User> {
        return this.userService.findById(payload.id)
    }
}
