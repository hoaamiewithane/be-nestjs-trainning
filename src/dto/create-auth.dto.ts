export interface createUserResponse {
  message: string;
}

export interface googleRequest {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    accessToken: string;
  };
}
export class CreateUserDto {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'user';
}
