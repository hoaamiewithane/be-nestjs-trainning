import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-auth.dto';

export class SignInUserDto extends PickType(CreateUserDto, [
  'username',
  'password',
]) {}
