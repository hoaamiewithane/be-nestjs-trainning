import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { NOTI_MICROSERVICE } from 'src/constants';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateAuthDto } from './dto/create-auth.dto';
import { SignInUserDto } from './dto/sign-in-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject(NOTI_MICROSERVICE) private readonly gateWayClient: ClientKafka,
  ) {}

  async create(createUserDto: CreateAuthDto) {
    const isExist = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (isExist) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'Already have an account',
      });
    }
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    await this.userRepository.save(createUserDto);
    this.gateWayClient.emit('send_mail', createUserDto);
    return { message: 'Successful' };
  }

  async signIn(signInUserDto: SignInUserDto) {
    const userDB = await this.userRepository.findOneBy({
      email: signInUserDto.email,
    });
    if (userDB?.password) {
      const isPwdMatch = await bcrypt.compare(
        signInUserDto.password,
        userDB.password,
      );

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

  async signInGoogle(email: string) {
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
