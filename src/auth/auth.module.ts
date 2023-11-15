import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partitioners } from 'kafkajs';
import { NOTI_MICROSERVICE } from 'src/constants';
import { Profile } from 'src/entities/profile.entity';
import { Ship } from 'src/entities/ship.entity';
import { User } from 'src/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
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
    JwtModule.register({
      global: true,
      secret: process.env['SECRET_KEY'],
      signOptions: { expiresIn: 10 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
