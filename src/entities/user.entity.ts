import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Ship } from './ship.entity';

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
  @OneToOne(() => Profile)
  @JoinColumn()
  profile: Profile;

  @ManyToMany(() => Ship, (ship) => ship.users)
  @JoinTable()
  ships: Ship[];
}
