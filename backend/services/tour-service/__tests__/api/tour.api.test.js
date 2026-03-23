const request = require('supertest');
const app = require('../../src/app');
const { Tour, sequelize } = require('../../src/models');

describe('Tour Service API - Supertest Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Tour.create({
      id: 1,
      num_tournee: 'API001',
      agent_id: 1,
      date_prevue: new Date('2024-01-15'),
      statut: 'PLANIFIEE'
    });

    await Tour.create({
      id: 2,
      num_tournee: 'API002',
      agent_id: 1,
      date_prevue: new Date('2024-01-16'),
      statut: 'EN_COURS'
    });
  });

  afterEach(async () => {
    await Tour.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/tour/:id', () => {

    test('should retrieve tour by id', async () => {
      const res = await request(app)
        .get('/api/tour/1');

      expect(res.status).toBe(200);
      expect(res.body.num_tournee).toBe('API001');
      expect(res.body.statut).toBe('PLANIFIEE');
    });

    test('should return 404 for non-existent tour', async () => {
      const res = await request(app)
        .get('/api/tour/999');

      expect(res.status).toBe(404);
    });

  });

  describe('GET /api/tour', () => {

    test('should list all tours', async () => {
      const res = await request(app)
        .get('/api/tour');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

  });

  describe('POST /api/tour', () => {

    test('should create new tour', async () => {
      const res = await request(app)
        .post('/api/tour')
        .send({
          num_tournee: 'NEW001',
          agent_id: 2,
          date_prevue: new Date('2024-01-17'),
          statut: 'PLANIFIEE'
        });

      expect(res.status).toBe(201);
      expect(res.body.num_tournee).toBe('NEW001');
      expect(res.body.agent_id).toBe(2);
    });

  });

  describe('PUT /api/tour/:id', () => {

    test('should update tour status', async () => {
      const res = await request(app)
        .put('/api/tour/1')
        .send({
          statut: 'EN_COURS'
        });

      expect(res.status).toBe(200);
      expect(res.body.statut).toBe('EN_COURS');
    });

  });

  describe('GET /api/agent/:agentId/tours', () => {

    test('should retrieve tours for agent', async () => {
      const res = await request(app)
        .get('/api/agent/1/tours');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.every(t => t.agent_id === 1)).toBe(true);
    });

  });

  describe('GET /health', () => {

    test('should return health status', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('tour-service');
    });

  });

});
