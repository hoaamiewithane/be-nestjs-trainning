export interface createUserResponse {
  message: string;
}
export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'user';
}
