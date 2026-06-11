const { sequelize, User } = require('../../src/models');
const HashService = require('../../src/services/HashService');

describe('User Model - Integration Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('create()', () => {

    test('should create user in database', async () => {
      const user = await User.create({
        email: 'agent@ecotrack.com',
        password: await HashService.hashPassword('Password@123'),
        role: 'agent',
      });
      expect(user.id).toBeDefined();
      expect(user.email).toBe('agent@ecotrack.com');
      expect(user.role).toBe('agent');
    });

    test('should enforce email uniqueness constraint', async () => {
      await User.create({ email: 'dup@test.com', password: 'hash1', role: 'agent' });
      await expect(
        User.create({ email: 'dup@test.com', password: 'hash2', role: 'citoyen' })
      ).rejects.toThrow();
    });

  });

  describe('findByPk()', () => {

    test('should retrieve user by primary key', async () => {
      const created = await User.create({ email: 'find@ecotrack.com', password: 'hash', role: 'agent' });
      const found = await User.findByPk(created.id);
      expect(found).not.toBeNull();
      expect(found.email).toBe('find@ecotrack.com');
    });

    test('should return null for non-existent UUID', async () => {
      const found = await User.findByPk('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });

  });

  describe('findOne()', () => {

    test('should find user by email', async () => {
      await User.create({ email: 'citoyen@ecotrack.com', password: 'hash', role: 'citoyen' });
      const found = await User.findOne({ where: { email: 'citoyen@ecotrack.com' } });
      expect(found).not.toBeNull();
      expect(found.role).toBe('citoyen');
    });

    test('should return null if user not found', async () => {
      const found = await User.findOne({ where: { email: 'nobody@test.com' } });
      expect(found).toBeNull();
    });

  });

  describe('update()', () => {

    test('should update user in database', async () => {
      const user = await User.create({ email: 'old@test.com', password: 'hash', role: 'agent' });
      await user.update({ email: 'new@test.com' });
      const updated = await User.findByPk(user.id);
      expect(updated.email).toBe('new@test.com');
    });

  });

  describe('destroy()', () => {

    test('should delete user from database', async () => {
      const user = await User.create({ email: 'del@test.com', password: 'hash', role: 'admin' });
      await user.destroy();
      const found = await User.findByPk(user.id);
      expect(found).toBeNull();
    });

  });

});
