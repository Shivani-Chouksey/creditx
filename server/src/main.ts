import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: false,
      transform:            true,
      transformOptions:     { enableImplicitConversion: true },
    }),
  );
  const uploadsRoot = process.env.UPLOADS_DIR
    ?? (process.env.VERCEL ? '/tmp/uploads' : join(process.cwd(), 'uploads'));
  app.useStaticAssets(uploadsRoot, { prefix: '/uploads' });
  //app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
   app.use(cookieParser());
  const logger = new Logger('Bootstrap');
   app.setGlobalPrefix('api/v1');
   app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('CreditX API')
    .setDescription('Auth + Multi Stage Form API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
    customfavIcon: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-32x32.png',
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀  API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
