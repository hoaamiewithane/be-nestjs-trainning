import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { NOTI_MICROSERVICE } from 'src/constants';
import { Profile } from 'src/entities/profile.entity';
import { User } from 'src/entities/user.entity';
import { Like, Repository } from 'typeorm';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @Inject(NOTI_MICROSERVICE) private readonly gateWayClient: ClientKafka,
  ) {}

  async getMe(email: string) {
    const userDB = await this.userRepository.findOneBy({
      email,
    });
    return { ...userDB, password: undefined };
  }

  async findAll({ limit, offset, searchTerm, role }: FindAllDto) {
    const res = await this.userRepository.findAndCount({
      where: {
        ...(searchTerm && { email: Like(`%${searchTerm}%`) }),
        role,
      },
      take: limit,
      skip: offset,
      relations: ['profile'],
    });

    return {
      data: [...res[0]].map((item) => ({
        ...item,
        password: undefined,
      })),
      count: res[1],
    };
  }

  async findOne(id: number) {
    const data = (await this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
      },
    })) as Partial<User>;
    delete data.password;
    return { ...data };
  }

  async updateOne({ id, role, ...profile }: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `User with ID ${id} not found.`,
      });
    }
    user.profile = await this.profileRepository.save({
      ...(user?.profile && { ...user.profile }),
      ...profile,
    });

    if (role) {
      user.role = role;
    }

    const newUser = (await this.userRepository.save(user)) as Partial<User>;
    delete newUser.password;
    return { ...newUser };
  }
}
