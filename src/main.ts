import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setDescription(
      'Ecommerce backend API. Access tokens expire after 15 minutes. ' +
      'Refresh tokens rotate on use and retain their original seven-day expiry. ' +
      'Logout revokes refresh sessions; existing access tokens remain valid until expiry.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the accessToken returned by login.',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: '/docs-json',
    swaggerOptions: {
      persistAuthorization: false,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();