import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    logger.log('[bootstrap] : starting Kraya procurement API');

    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(PinoLogger));
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Kraya Procurement API')
        .setDescription('Procurement platform backend with JWT auth and RBAC')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));

    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`[bootstrap] : API running on http://localhost:${port}`);
    logger.log(`[bootstrap] : Swagger docs at http://localhost:${port}/api/docs`);
    logger.log('[bootstrap] : execution finished');
}

void bootstrap();
