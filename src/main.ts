import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.setGlobalPrefix('api', { exclude: ['cats'] });
  // app.setGlobalPrefix('api');
  // app.setGlobalPrefix('api', {
  //   exclude: [
  //     'auth',
  //     'messages',
  //     {
  //       path: 'call',
  //       method: RequestMethod.ALL,
  //     },
  //   ],
  // });
  app.enableCors({
    origin: process.env.CLIENT_URI,
  });
  await app.listen(process.env.PORT || 5000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
