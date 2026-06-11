const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('Tour Service API - Supertest Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /health', () => {

    test('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('tour-service');
    });

  });

  describe('Auth enforcement', () => {

    test('GET /api/tournees should require auth (401)', async () => {
      const res = await request(app).get('/api/tournees');
      expect(res.status).toBe(401);
    });

    test('POST /api/tournees should require auth (401)', async () => {
      const res = await request(app).post('/api/tournees').send({});
      expect(res.status).toBe(401);
    });

    test('GET /api/tournees/:id should require auth (401)', async () => {
      const res = await request(app).get('/api/tournees/some-id');
      expect(res.status).toBe(401);
    });

  });

});
