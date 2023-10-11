import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { FindAllDto } from './dto/find-all.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('get_me')
  getMe(@Payload() email: string) {
    return this.userService.getMe(email);
  }

  @MessagePattern('list_user')
  findAll(@Payload() findAllDto: FindAllDto) {
    return this.userService.findAll(findAllDto);
  }

  @MessagePattern('find_one_user')
  findOne(@Payload() id: number) {
    return this.userService.findOne(id);
  }

  @MessagePattern('edit_user')
  updateOne(@Payload() updateUserDto: UpdateUserDto) {
    return this.userService.updateOne(updateUserDto);
  }
}
