import { AuthGuard } from '@nestjs/passport'
import { REFRESH_TOKEN } from 'src/constants'

export class RefreshTokenGuard extends AuthGuard(REFRESH_TOKEN) {}
