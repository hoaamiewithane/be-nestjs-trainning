import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-auth.dto';
import { User } from './entities/user.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @MessagePattern('get_user')
  async handleUserCreate(@Payload() data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;
    this.userRepository.save(data);
    return { data };
  }
}
