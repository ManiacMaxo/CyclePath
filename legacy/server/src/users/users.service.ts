import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from './entity/user.entity'
import * as bcrypt from 'bcrypt'
import { CreateUserDto } from 'src/auth/dto/create-user.dto'
import { AuthUserDto } from 'src/auth/dto/auth-user.dto'
import { Repository } from 'typeorm'

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const password: string = await bcrypt.hash(createUserDto.password, 13)

        const user: User = this.usersRepository.create({ ...createUserDto, password })

        return this.usersRepository.save(user)
    }

    async findById(id: number): Promise<User> {
        const user: User = await this.usersRepository.findOne(id)

        if (!user) {
            throw new NotFoundException()
        }

        return user
    }

    async findByEmail(email: string): Promise<User> {
        const user: User = await this.usersRepository.findOne({ email })

        if (!user) {
            throw new NotFoundException()
        }

        return user
    }

    async findAuthUser(authUserDto: AuthUserDto): Promise<User> {
        const { email, password } = authUserDto
        const user: User = await this.findByEmail(email)

        await this.verifyPassword(password, user.password)

        return user
    }

    private async verifyPassword(plainTextPassword: string, hashedPasword: string): Promise<void> {
        const valid: boolean = await bcrypt.compare(plainTextPassword, hashedPasword)

        if (!valid) {
            throw new BadRequestException()
        }
    }
}
