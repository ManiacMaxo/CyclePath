import { User } from 'src/users/entity/user.entity'

export interface AuthenticatedRequest extends Request {
    user: User
}
