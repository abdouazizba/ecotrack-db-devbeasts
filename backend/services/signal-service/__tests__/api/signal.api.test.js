const request = require('supertest');
const app = require('../../src/app');
const { Signal, sequelize } = require('../../src/models');

describe('Signal Service API - Supertest Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Signal.create({
      id: 1,
      citoyen_id: 1,
      titre: 'Conteneur endommagé',
      description: 'Le conteneur est cassé',
      type: 'PROBLEME',
      latitude: 48.8566,
      longitude: 2.3522,
      statut: 'OUVERTE'
    });

    await Signal.create({
      id: 2,
      citoyen_id: 2,
      titre: 'Amélioration',
      description: 'Suggestion d\'amélioration',
      type: 'SUGGESTION',
      latitude: 48.85,
      longitude: 2.35,
      statut: 'OUVERTE'
    });
  });

  afterEach(async () => {
    await Signal.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/signal/:id', () => {

    test('should retrieve signal by id', async () => {
      const res = await request(app)
        .get('/api/signal/1');

      expect(res.status).toBe(200);
      expect(res.body.titre).toBe('Conteneur endommagé');
      expect(res.body.type).toBe('PROBLEME');
    });

    test('should return 404 for non-existent signal', async () => {
      const res = await request(app)
        .get('/api/signal/999');

      expect(res.status).toBe(404);
    });

  });

  describe('GET /api/signal', () => {

    test('should list all signals', async () => {
      const res = await request(app)
        .get('/api/signal');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

  });

  describe('POST /api/signal', () => {

    test('should create new signal', async () => {
      const res = await request(app)
        .post('/api/signal')
        .send({
          citoyen_id: 3,
          titre: 'Nouveau signal',
          description: 'Description du nouveau signal',
          type: 'PROBLEME',
          latitude: 48.86,
          longitude: 2.36,
          statut: 'OUVERTE'
        });

      expect(res.status).toBe(201);
      expect(res.body.titre).toBe('Nouveau signal');
      expect(res.body.citoyen_id).toBe(3);
    });

  });

  describe('PUT /api/signal/:id', () => {

    test('should update signal status', async () => {
      const res = await request(app)
        .put('/api/signal/1')
        .send({
          statut: 'EN_COURS'
        });

      expect(res.status).toBe(200);
      expect(res.body.statut).toBe('EN_COURS');
    });

  });

  describe('GET /api/citizen/:citizenId/signals', () => {

    test('should retrieve signals for citizen', async () => {
      const res = await request(app)
        .get('/api/citizen/1/signals');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every(s => s.citoyen_id === 1)).toBe(true);
    });

  });

  describe('GET /api/signal/status/:status', () => {

    test('should retrieve signals by status', async () => {
      const res = await request(app)
        .get('/api/signal/status/OUVERTE');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every(s => s.statut === 'OUVERTE')).toBe(true);
    });

  });

  describe('GET /health', () => {

    test('should return health status', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('signal-service');
    });

  });

});
