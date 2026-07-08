import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ApiResponseInterceptor } from '../src/common/interceptors/api-response.interceptor';
import { HealthController } from '../src/health.controller';

describe('Health (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1');
        app.useGlobalInterceptors(new ApiResponseInterceptor());
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/api/v1/health (GET)', () => {
        return request(app.getHttpServer())
            .get('/api/v1/health')
            .expect(200)
            .expect((res) => {
                const body = res.body as {
                    success: boolean;
                    data: { status: string; service: string };
                };
                expect(body.success).toBe(true);
                expect(body.data.status).toBe('ok');
                expect(body.data.service).toBe('kraya-procurement-backend');
            });
    });
});
