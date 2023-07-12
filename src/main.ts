import * as compression from 'compression';
import * as passport from 'passport';
import * as session from 'express-session';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalPipes(new ValidationPipe());

  app.use(
    session({
      secret: 'process.env.SESSION_SECRET',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000,
      },
    }),
  );

  app.use(
    compression({
      threshold: 100 * 1000,
    }),
  );

  console.log('process', process.env.CLIENT_URI);

  app.enableCors({
    origin: '*',
  });
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT || 4000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
