import { PickType } from '@nestjs/mapped-types';
import { CreateAuthDto } from './create-auth.dto';

export class SignInUserDto extends PickType(CreateAuthDto, [
  'email',
  'password',
  'role',
]) {}
