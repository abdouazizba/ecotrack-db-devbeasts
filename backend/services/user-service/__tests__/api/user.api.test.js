const request = require('supertest');
const app = require('../../src/app');
const { Utilisateur, Agent, sequelize } = require('../../src/models');

describe('User Service API - Supertest Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create test users
    await Utilisateur.create({
      id: 1,
      email: 'agent1@ecotrack.com',
      nom: 'Agent',
      prenom: 'One',
      num_telephone: '+33600000001'
    });

    await Agent.create({
      id: 1,
      utilisateur_id: 1,
      num_badge: 'BADGE001',
      zone_affectation: 'Zone A'
    });
  });

  afterEach(async () => {
    await Utilisateur.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/users/:id', () => {

    test('should retrieve user by id', async () => {
      const res = await request(app)
        .get('/api/users/1');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('agent1@ecotrack.com');
      expect(res.body.nom).toBe('Agent');
    });

    test('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/999');

      expect(res.status).toBe(404);
    });

  });

  describe('GET /api/users', () => {

    test('should list all users', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

  });

  describe('POST /api/users', () => {

    test('should create new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          email: 'newuser@ecotrack.com',
          nom: 'New',
          prenom: 'User',
          num_telephone: '+33600000002'
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('newuser@ecotrack.com');
      expect(res.body.id).toBeDefined();
    });

    test('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          email: 'incomplete@ecotrack.com'
          // Missing nom and prenom
        });

      expect(res.status).toBe(400);
    });

  });

  describe('PUT /api/users/:id', () => {

    test('should update user', async () => {
      const res = await request(app)
        .put('/api/users/1')
        .send({
          nom: 'Updated',
          prenom: 'Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.nom).toBe('Updated');
    });

  });

  describe('DELETE /api/users/:id', () => {

    test('should delete user', async () => {
      // Create a user to delete
      await Utilisateur.create({
        id: 99,
        email: 'delete@ecotrack.com',
        nom: 'Delete',
        prenom: 'Me'
      });

      const res = await request(app)
        .delete('/api/users/99');

      expect(res.status).toBe(200);

      // Verify deletion
      const check = await request(app)
        .get('/api/users/99');
      expect(check.status).toBe(404);
    });

  });

  describe('GET /health', () => {

    test('should return health status', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('user-service');
    });

  });

});
