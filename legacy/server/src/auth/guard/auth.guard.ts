import { AuthGuard } from '@nestjs/passport'
import { AUTH } from 'src/constants'

export class AuthJwtGuard extends AuthGuard(AUTH) {}
