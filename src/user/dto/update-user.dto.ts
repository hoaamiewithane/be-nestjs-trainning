export class UpdateUserDto {
  id: number;
  firstName?: string;
  lastName?: string;
  gender?: string;
  role?: 'admin' | 'user';
}
