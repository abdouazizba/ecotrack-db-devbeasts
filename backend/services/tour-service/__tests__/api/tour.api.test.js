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

  describe('Tournee Auth enforcement', () => {

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

  describe('Vehicule Auth enforcement', () => {

    test('GET /api/vehicules should require auth (401)', async () => {
      const res = await request(app).get('/api/vehicules');
      expect(res.status).toBe(401);
    });

    test('POST /api/vehicules should require auth (401)', async () => {
      const res = await request(app)
        .post('/api/vehicules')
        .send({ immatriculation: 'AB-123-CD', marque: 'Renault' });
      expect(res.status).toBe(401);
    });

    test('GET /api/vehicules/:id should require auth (401)', async () => {
      const res = await request(app).get('/api/vehicules/some-id');
      expect(res.status).toBe(401);
    });

    test('PUT /api/vehicules/:id should require auth (401)', async () => {
      const res = await request(app)
        .put('/api/vehicules/some-id')
        .send({ statut: 'INACTIF' });
      expect(res.status).toBe(401);
    });

    test('DELETE /api/vehicules/:id should require auth (401)', async () => {
      const res = await request(app).delete('/api/vehicules/some-id');
      expect(res.status).toBe(401);
    });

    test('GET /api/vehicules/maintenance-due should require auth (401)', async () => {
      const res = await request(app).get('/api/vehicules/maintenance-due');
      expect(res.status).toBe(401);
    });

    test('POST /api/vehicules/:id/maintenance should require auth (401)', async () => {
      const res = await request(app)
        .post('/api/vehicules/some-id/maintenance')
        .send({ notes: 'test' });
      expect(res.status).toBe(401);
    });

  });

});
