const request = require('supertest');
const app = require('../../src/app');
const { User, sequelize } = require('../../src/models');
const HashService = require('../../src/services/HashService');

describe('Auth API - Supertest Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await User.create({
      email: 'agent1@ecotrack.com',
      password: await HashService.hashPassword('Password@123'),
      role: 'agent',
    });
  });

  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {

    test('should return tokens on successful login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'agent1@ecotrack.com', password: 'Password@123' });

      expect(res.status).toBe(200);
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.data.email).toBe('agent1@ecotrack.com');
      expect(res.body.data.role).toBe('agent');
    });

    test('should return 401 for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@ecotrack.com', password: 'Password@123' });
      expect(res.status).toBe(401);
    });

    test('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'agent1@ecotrack.com', password: 'WrongPass!99' });
      expect(res.status).toBe(401);
    });

    test('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'agent1@ecotrack.com' });
      expect(res.status).toBe(400);
    });

  });

  describe('POST /api/auth/verify', () => {

    test('should confirm valid JWT token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'agent1@ecotrack.com', password: 'Password@123' });
      const token = loginRes.body.tokens.accessToken;

      const verifyRes = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.valid).toBe(true);
    });

    test('should return 401 when no token is provided', async () => {
      const res = await request(app).post('/api/auth/verify');
      expect(res.status).toBe(401);
    });

    test('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });

  });

  describe('GET /health', () => {

    test('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('auth-service');
    });

  });

});
