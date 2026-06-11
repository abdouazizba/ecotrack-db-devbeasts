const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('Container Service API - Supertest Tests', () => {

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
      expect(res.body.service).toBe('container-service');
    });

  });

  describe('Authentication enforcement', () => {

    test('GET /api/conteneurs should require auth (401)', async () => {
      const res = await request(app).get('/api/conteneurs');
      expect(res.status).toBe(401);
    });

    test('POST /api/conteneurs should require auth (401)', async () => {
      const res = await request(app)
        .post('/api/conteneurs')
        .send({ code_conteneur: 'TEST001', type_conteneur: 'standard', capacite: 500 });
      expect(res.status).toBe(401);
    });

    test('GET /api/zones should require auth (401)', async () => {
      const res = await request(app).get('/api/zones');
      expect(res.status).toBe(401);
    });

  });

});
