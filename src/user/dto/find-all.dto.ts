export class FindAllDto {
  limit: number;
  offset: number;
  searchTerm?: string;
  role?: 'admin' | 'user';
}
