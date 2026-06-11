const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('User Service API - Supertest Tests', () => {

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
      expect(res.body.service).toBe('user-service');
    });

  });

  describe('Auth enforcement', () => {

    test('GET /api/users should require auth (401)', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    test('GET /api/users/:id should require auth (401)', async () => {
      const res = await request(app).get('/api/users/some-id');
      expect(res.status).toBe(401);
    });

    test('PUT /api/users/:id should require auth (401)', async () => {
      const res = await request(app).put('/api/users/some-id').send({ nom: 'Test' });
      expect(res.status).toBe(401);
    });

    test('DELETE /api/users/:id should require auth (401)', async () => {
      const res = await request(app).delete('/api/users/some-id');
      expect(res.status).toBe(401);
    });

  });

});
