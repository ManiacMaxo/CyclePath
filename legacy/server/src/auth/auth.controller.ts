import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
    ValidationPipe
} from '@nestjs/common'
import { Response } from 'express'
import { REFRESH_TOKEN_COOKIE_NAME } from 'src/constants'
import { AuthService } from './auth.service'
import { AuthUserDto } from './dto/auth-user.dto'
import { CreateUserDto } from './dto/create-user.dto'
import { AuthJwtGuard } from './guard/auth.guard'
import { RefreshTokenGuard } from './guard/refresh-token.guard'
import { AuthenticatedRequest } from './interfaces/auth-request.interface'
import { AuthTokens } from './interfaces/auth-tokens.interface'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('sign-up')
    async signUp(
        @Body(ValidationPipe) createUserDto: CreateUserDto,
        @Res() res: Response
    ): Promise<void> {
        try {
            const tokenResponse: AuthTokens = await this.authService.signUp(createUserDto)

            this.sendResponse(res, tokenResponse)
        } catch (error) {
            if (error.code === '23505') {
                throw new BadRequestException()
            }
        }
    }

    @Post('sign-in')
    async signIn(
        @Body(ValidationPipe) authUserDto: AuthUserDto,
        @Res() res: Response
    ): Promise<void> {
        const tokenResponse: AuthTokens = await this.authService.signIn(authUserDto)

        this.sendResponse(res, tokenResponse)
    }

    @UseGuards(AuthJwtGuard)
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    logout(@Res() res: Response): void {
        this.sendResponse(res, { refreshToken: '', token: '' })
    }

    @UseGuards(RefreshTokenGuard)
    @Post('refresh-token')
    getAccessTokenFromRefreshToken(@Req() req: AuthenticatedRequest, @Res() res: Response): void {
        const tokenResponse: AuthTokens = this.authService.getTokens(req.user)

        this.sendResponse(res, tokenResponse)
    }

    private sendResponse(res: Response, tokenResponse: AuthTokens): void {
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokenResponse.refreshToken, {
            httpOnly: true,
            path: '/auth/refresh-token',
            ...(process.env.NODE_ENV == 'production' ? { sameSite: 'none', secure: true } : {})
        })

        res.status(201).json({ token: tokenResponse.token })
    }
}
