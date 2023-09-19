export interface createUserResponse {
  message: string;
}
export class CreateUserDto {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'user';
}
