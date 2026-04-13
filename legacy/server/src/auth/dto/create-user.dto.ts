import { IsEmail, Matches, MinLength } from 'class-validator'
import { PASSWORD_REGEX } from 'src/constants'

export class CreateUserDto {
    @MinLength(2)
    name: string

    @IsEmail()
    email: string

    @Matches(PASSWORD_REGEX)
    password: string
}
