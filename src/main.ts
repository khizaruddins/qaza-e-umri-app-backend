import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import basicAuth from 'express-basic-auth';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.setGlobalPrefix('api'); // Set the global prefix for all routes
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(helmet());

  const logger = app.get(Logger);

  const configService: ConfigService = app.get(ConfigService);
  const swaggerUsername =
    typeof configService.get === 'function'
      ? configService.get<string>('SWAGGER_USERNAME')
      : undefined;
  const swaggerPassword =
    typeof configService.get === 'function'
      ? configService.get<string>('SWAGGER_PASSWORD')
      : undefined;

  if (!swaggerPassword) {
    logger.error(
      'SWAGGER_PASSWORD is not set in the environment variables. Please set it to secure the Swagger documentation.',
    );
  }

  app.use(
    ['/api/docs', '/api/docs-json'],
    basicAuth({
      challenge: true,
      users: { [String(swaggerUsername)]: swaggerPassword as string },
      unauthorizedResponse: (req: express.Request) => ({
        statusCode: 401,
        message: 'Unauthorized access to API documentation',
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
        path: req.url,
      }),
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Qaza-e-Umri API')
    .setDescription('Backend for tracking missed prayers')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = 3200;
  await app.listen(port);

  console.log(`Server running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
