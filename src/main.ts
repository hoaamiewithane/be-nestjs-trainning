import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env['HOST'],
      port: process.env['USER_PORT'] as unknown as number,
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env['USER_PORT'] as unknown as number);
}

bootstrap().then(() => {
  console.log('User-service started', process.env['USER_PORT']);
});
