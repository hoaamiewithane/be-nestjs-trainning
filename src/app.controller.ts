import { Controller, HttpStatus, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ClientKafka,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Like, Repository } from 'typeorm';
import { NOTI_MICROSERVICE } from './constants';
import { CreateUserDto } from './dto/create-auth.dto';
import { SignInUserDto } from './dto/sign-in-auth.dto';
import { User } from './entities/user.entity';

@Controller()
export class AppController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject(NOTI_MICROSERVICE) private readonly gateWayClient: ClientKafka,
  ) {}

  @MessagePattern('create_user')
  async handleUserCreate(@Payload() data: CreateUserDto) {
    const isExist = await this.userRepository.findOneBy({
      email: data.email,
    });
    if (isExist) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'Already have an account',
      });
    }
    data.password = await bcrypt.hash(data.password, 10);
    this.userRepository.save(data);
    this.gateWayClient.emit('send_mail', data);
    return { message: 'Successful' };
  }

  @MessagePattern('sign_in_user')
  async handleUserLogin(@Payload() data: SignInUserDto) {
    const userDB = await this.userRepository.findOneBy({
      email: data.email,
    });
    if (userDB?.password) {
      const isPwdMatch = await bcrypt.compare(data.password, userDB.password);

      if (isPwdMatch) {
        const payload = {
          sub: userDB.id,
          email: userDB.email,
          role: userDB.role,
        };

        return {
          accessToken: await this.jwtService.signAsync(payload),
          ...userDB,
          password: undefined,
        };
      }
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Wrong password',
      });
    }
    throw new RpcException({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'User does not exist',
    });
  }

  @MessagePattern('get_me')
  async handleGetMe(@Payload() email: string) {
    const userDB = await this.userRepository.findOneBy({
      email,
    });
    return { ...userDB, password: undefined };
  }

  @MessagePattern('list_user')
  async findListUser(
    @Payload()
    {
      limit,
      offset,
      searchTerm,
      role,
    }: {
      limit: number;
      offset: number;
      searchTerm?: string;
      role?: 'admin' | 'user';
    },
  ) {
    const data = await this.userRepository.find({
      where: {
        ...(searchTerm && { email: Like(`%${searchTerm}%`) }),
        role,
      },
      take: limit,
      skip: offset,
    });

    const count = await this.userRepository.count({
      where: {
        ...(searchTerm && { email: Like(`%${searchTerm}%`) }),
        role,
      },
    });

    return {
      data: [...data].map((item) => ({
        ...item,
        password: undefined,
      })),
      count,
    };
  }

  @MessagePattern('find_one_user')
  async findOne(@Payload() id: number) {
    const data = (await this.userRepository.findOneBy({
      id,
    })) as Partial<User>;
    delete data.password;
    return {
      data,
    };
  }

  @MessagePattern('login_with_google')
  async handleLoginGoogle(@Payload() email: string) {
    const userDB = await this.userRepository.findOneBy({ email });

    let ggUser: User;

    if (userDB) {
      if (userDB.password) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }
      ggUser = userDB;
    } else {
      ggUser = await this.userRepository.save({
        email,
        role: 'user',
      });
    }

    const payload = {
      sub: ggUser.id,
      email: ggUser.email,
      role: ggUser.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      ...ggUser,
      password: undefined,
    };
  }
}
