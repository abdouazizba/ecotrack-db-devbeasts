const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('Signal Service API - Supertest Tests', () => {

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
      expect(res.body.service).toBe('signal-service');
    });

  });

  describe('Authentication enforcement', () => {

    test('GET /api/signalements should require auth (401)', async () => {
      const res = await request(app).get('/api/signalements');
      expect(res.status).toBe(401);
    });

    test('POST /api/signalements should require auth (401)', async () => {
      const res = await request(app)
        .post('/api/signalements')
        .send({ type: 'CONTENEUR_PLEIN', id_conteneur: 'abc' });
      expect(res.status).toBe(401);
    });

  });

});
