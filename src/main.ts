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
  const configService = app.get(ConfigService);

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

  const deployedUrl = configService.get<string>('DEPLOYED_URL');
  const origins = [
    'http://localhost:3000',
    'https://qaza-e-umri-kuqd09a3x-syed-khizaruddins-projects.vercel.app/',
    'https://qaza-e-umri-app.vercel.app',
  ];

  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(helmet());

  const logger = app.get(Logger);

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

  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');

  const displayUrl = deployedUrl || `http://localhost:${port}`;

  console.log(`Server running on: ${displayUrl}`);
  console.log(`Swagger docs available at: ${displayUrl}/api/docs`);
}
bootstrap();
