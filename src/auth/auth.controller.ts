import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { SignInUserDto } from './dto/sign-in-auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'create_user' })
  create(@Payload() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @MessagePattern('sign_in_user')
  signIn(@Payload() signInUserDto: SignInUserDto) {
    return this.authService.signIn(signInUserDto);
  }

  @MessagePattern('refresh_token')
  refreshToken(@Payload() tokenDto: string) {
    return this.authService.refreshToken(tokenDto);
  }

  @MessagePattern('login_with_google')
  signInGoogle(@Payload() email: string) {
    return this.authService.signInGoogle(email);
  }
}
