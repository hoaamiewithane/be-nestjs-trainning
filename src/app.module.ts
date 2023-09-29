import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partitioners } from 'kafkajs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NOTI_MICROSERVICE } from './constants';
import { User } from './entities/user.entity';

@Module({
  imports: [
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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.HOST,
      port: parseInt(process.env.DB_PORT as string),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: true,
      entities: [User],
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      global: true,
      secret: process.env.SECRECT_KEY,
      signOptions: { expiresIn: 3600 },
    }),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
