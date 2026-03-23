const request = require('supertest');
const app = require('../../src/app');
const { User, sequelize } = require('../../src/models');
const HashService = require('../../src/services/HashService');

describe('Auth API - Supertest Tests', () => {
  
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create test user
    await User.create({
      id: 1,
      email: 'agent1@ecotrack.com',
      password_hash: HashService.hash('password123'),
      role: 'AGENT'
    });
  });

  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    
    test('should return JWT token on successful login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'agent1@ecotrack.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('agent1@ecotrack.com');
      expect(res.body.user.role).toBe('AGENT');
    });

    test('should return 401 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@ecotrack.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.token).toBeUndefined();
    });

    test('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'agent1@ecotrack.com',
          password: 'wrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.token).toBeUndefined();
    });

    test('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'agent1@ecotrack.com'
          // Missing password
        });

      expect(res.status).toBe(400);
    });

  });

  describe('GET /api/auth/verify', () => {
    
    test('should verify valid JWT token', async () => {
      // First login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'agent1@ecotrack.com',
          password: 'password123'
        });

      const token = loginRes.body.token;

      // Then verify
      const verifyRes = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.valid).toBe(true);
      expect(verifyRes.body.user).toBeDefined();
    });

    test('should return 401 for missing token', async () => {
      const res = await request(app)
        .get('/api/auth/verify');

      expect(res.status).toBe(401);
    });

    test('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });

  });

  describe('GET /health', () => {
    
    test('should return health status', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('auth-service');
    });

  });

});
