import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-auth.dto';
import { SignInUserDto } from './dto/sign-in-auth.dto';
import { User } from './entities/user.entity';

interface tokenPayload {
  sub: number;
  username: string;
  role: string;
}
@Controller()
export class AppController implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject('NOTI_MICROSERVICE') private readonly gateWayClient: ClientKafka,
  ) {}

  @MessagePattern('create_user')
  async handleUserCreate(@Payload() data: CreateUserDto) {
    const isExist = await this.userRepository.findOneBy({
      username: data.username,
    });
    if (isExist) {
      return { message: 'Already have account' };
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;
    this.userRepository.save(data);
    this.gateWayClient.emit('send_mail', data);
    return { message: 'Successful' };
  }
  @MessagePattern('sign_in_user')
  async handleUserLogin(@Payload() data: SignInUserDto) {
    const userDB = await this.userRepository.findOneBy({
      email: data.email,
    });
    if (userDB) {
      const passwordMatch = await bcrypt.compare(
        data.password,
        userDB.password,
      );

      if (passwordMatch) {
        const payload = {
          sub: userDB.id,
          email: userDB.email,
          role: userDB.role,
        };
        return { accessToken: await this.jwtService.signAsync(payload) };
      }
      return { message: 'Wrong password' };
    }
    return { message: 'User does not exist' };
  }

  @MessagePattern('get_me')
  async handleGetMe(@Payload() token: string) {
    const payload = this.jwtService.decode(token) as tokenPayload;
    const userDB: Partial<User> | null = await this.userRepository.findOneBy({
      id: payload.sub,
    });
    delete userDB?.password;
    return { data: userDB };
  }

  @MessagePattern('find_all_user')
  async findAll() {
    const data = (await this.userRepository.find()) as Partial<User>[];
    data?.map((user) => {
      delete user.password;
      return user;
    });
    return { data };
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
  async handleLoginGoogle(@Payload() data: any) {
    const userDB = await this.userRepository.findOneBy({ email: data.email });

    let ggUser: User;

    if (userDB) {
      ggUser = userDB;
    } else {
      data.role = 'user';
      ggUser = await this.userRepository.save(data);
    }

    const payload = {
      sub: ggUser.id,
      email: ggUser.email,
      role: ggUser.role,
    };

    return { accessToken: await this.jwtService.signAsync(payload) };
  }
  onModuleInit() {
    this.gateWayClient.subscribeToResponseOf('send_mail');
  }
}
