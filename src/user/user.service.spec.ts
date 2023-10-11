import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTI_MICROSERVICE } from 'src/constants';
import { Partitioners } from 'kafkajs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Ship } from 'src/entities/ship.entity';
import { Profile } from 'src/entities/profile.entity';
import { ConfigModule } from '@nestjs/config';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        ClientsModule.register([
          {
            name: NOTI_MICROSERVICE,
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'user-service',
                brokers: [`localhost:9092`],
              },
              consumer: {
                groupId: 'noti-consumer',
              },
              producer: {
                createPartitioner: Partitioners.LegacyPartitioner,
              },
            },
          },
        ]),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.HOST,
          port: parseInt(process.env['DB_PORT'] as string),
          username: process.env['DB_USERNAME'],
          password: process.env['DB_PASSWORD'],
          database: process.env['DB_DATABASE'],
          synchronize: true,
          entities: [User, Profile, Ship],
        }),
        TypeOrmModule.forFeature([User, Ship, Profile]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
