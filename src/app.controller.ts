import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-auth.dto';
import { SignInUserDto } from './dto/sign-in-auth.dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class AppController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
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
    return { message: 'Successful' };
  }
  @MessagePattern('sign_in_user')
  async handleUserLogin(@Payload() data: SignInUserDto) {
    const userDB = await this.userRepository.findOneBy({
      username: data.username,
    });
    if (userDB) {
      const passwordMatch = await bcrypt.compare(
        data.password,
        userDB.password,
      );

      if (passwordMatch) {
        const payload = { sub: userDB.id, username: userDB.username };
        return { accessToken: await this.jwtService.signAsync(payload) };
      }
      return { message: 'Wrong password' };
    }
    return { message: 'User does not exist' };
  }
}
