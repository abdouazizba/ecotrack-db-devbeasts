const request = require('supertest');
const app = require('../../src/app');
const { Conteneur, Zone, sequelize } = require('../../src/models');

describe('Container Service API - Supertest Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    const zone = await Zone.create({
      id: 1,
      nom: 'Zone API',
      latitude: 48.8566,
      longitude: 2.3522,
      rayon_km: 1
    });

    await Conteneur.create({
      id: 1,
      code_rfid: 'API001',
      type: 'RECYCLABLES',
      capacite_litres: 1000,
      etat: 'OPERATIONNEL',
      zone_id: 1
    });
  });

  afterEach(async () => {
    await Conteneur.destroy({ where: {} });
    await Zone.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/container/:id', () => {

    test('should retrieve container by id', async () => {
      const res = await request(app)
        .get('/api/container/1');

      expect(res.status).toBe(200);
      expect(res.body.code_rfid).toBe('API001');
      expect(res.body.type).toBe('RECYCLABLES');
    });

    test('should return 404 for non-existent container', async () => {
      const res = await request(app)
        .get('/api/container/999');

      expect(res.status).toBe(404);
    });

  });

  describe('GET /api/container', () => {

    test('should list all containers', async () => {
      const res = await request(app)
        .get('/api/container');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

  });

  describe('POST /api/container', () => {

    test('should create new container', async () => {
      const res = await request(app)
        .post('/api/container')
        .send({
          code_rfid: 'NEW001',
          type: 'DECHETS',
          capacite_litres: 800,
          etat: 'OPERATIONNEL',
          zone_id: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.code_rfid).toBe('NEW001');
      expect(res.body.id).toBeDefined();
    });

  });

  describe('PUT /api/container/:id', () => {

    test('should update container state', async () => {
      const res = await request(app)
        .put('/api/container/1')
        .send({
          etat: 'EN_MAINTENANCE'
        });

      expect(res.status).toBe(200);
      expect(res.body.etat).toBe('EN_MAINTENANCE');
    });

  });

  describe('GET /api/zone/:zoneId/containers', () => {

    test('should retrieve containers in zone', async () => {
      const res = await request(app)
        .get('/api/zone/1/containers');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

  });

  describe('GET /health', () => {

    test('should return health status', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('container-service');
    });

  });

});
