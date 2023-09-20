import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('user')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: true })
  username: string;
  @Column()
  email: string;
  @Column({ nullable: true })
  password: string;
  @Column()
  role: string;
}
