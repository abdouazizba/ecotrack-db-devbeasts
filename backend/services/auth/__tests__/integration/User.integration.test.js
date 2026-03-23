const { sequelize, User } = require('../../src/models');
const HashService = require('../../src/services/HashService');

describe('User Model - Integration Tests', () => {
  
  beforeAll(async () => {
    // Sync database for tests
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    // Clean up after each test
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('create() method', () => {
    
    test('should create user in database', async () => {
      const user = await User.create({
        email: 'agent@ecotrack.com',
        password_hash: HashService.hash('password123'),
        role: 'AGENT'
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('agent@ecotrack.com');
      expect(user.role).toBe('AGENT');
    });

    test('should enforce email uniqueness constraint', async () => {
      await User.create({
        email: 'duplicate@test.com',
        password_hash: HashService.hash('pass1'),
        role: 'AGENT'
      });

      await expect(
        User.create({
          email: 'duplicate@test.com',
          password_hash: HashService.hash('pass2'),
          role: 'CITOYEN'
        })
      ).rejects.toThrow();
    });

  });

  describe('findByPk() method', () => {
    
    test('should retrieve user by primary key', async () => {
      const created = await User.create({
        email: 'test@ecotrack.com',
        password_hash: HashService.hash('password'),
        role: 'AGENT'
      });

      const found = await User.findByPk(created.id);
      expect(found).toBeDefined();
      expect(found.email).toBe('test@ecotrack.com');
    });

    test('should return null for non-existent user', async () => {
      const found = await User.findByPk(9999);
      expect(found).toBeNull();
    });

  });

  describe('findOne() method', () => {
    
    test('should find user by email', async () => {
      await User.create({
        email: 'citoyen@ecotrack.com',
        password_hash: HashService.hash('pass123'),
        role: 'CITOYEN'
      });

      const found = await User.findOne({
        where: { email: 'citoyen@ecotrack.com' }
      });

      expect(found).toBeDefined();
      expect(found.role).toBe('CITOYEN');
    });

    test('should return null if user not found', async () => {
      const found = await User.findOne({
        where: { email: 'nonexistent@test.com' }
      });

      expect(found).toBeNull();
    });

  });

  describe('update() method', () => {
    
    test('should update user in database', async () => {
      const user = await User.create({
        email: 'oldname@test.com',
        password_hash: HashService.hash('pass'),
        role: 'AGENT'
      });

      await user.update({ email: 'newname@test.com' });

      const updated = await User.findByPk(user.id);
      expect(updated.email).toBe('newname@test.com');
    });

  });

  describe('destroy() method', () => {
    
    test('should delete user from database', async () => {
      const user = await User.create({
        email: 'delete@test.com',
        password_hash: HashService.hash('pass'),
        role: 'ADMIN'
      });

      await user.destroy();

      const found = await User.findByPk(user.id);
      expect(found).toBeNull();
    });

  });

});
