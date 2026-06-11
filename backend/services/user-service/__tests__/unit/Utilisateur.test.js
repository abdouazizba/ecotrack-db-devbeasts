const { Utilisateur, Agent, sequelize } = require('../../src/models');

describe('Utilisateur Model - Unit Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Agent.destroy({ where: {} });
    await Utilisateur.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Utilisateur Creation', () => {

    test('should create a new utilisateur', async () => {
      const u = await Utilisateur.create({
        email: 'agent@ecotrack.com',
        nom: 'Agent Test',
        prenom: 'Test',
        role: 'agent',
      });
      expect(u.id).toBeDefined();
      expect(u.email).toBe('agent@ecotrack.com');
      expect(u.nom).toBe('Agent Test');
      expect(u.role).toBe('agent');
    });

    test('should enforce email uniqueness', async () => {
      await Utilisateur.create({ email: 'dup@ecotrack.com', role: 'citoyen' });
      await expect(
        Utilisateur.create({ email: 'dup@ecotrack.com', role: 'agent' })
      ).rejects.toThrow();
    });

  });

  describe('Agent Creation', () => {

    test('should create Agent linked to Utilisateur', async () => {
      const u = await Utilisateur.create({ email: 'agent2@ecotrack.com', role: 'agent' });
      const agent = await Agent.create({ id: u.id, numero_badge: 'BADGE001' });
      expect(agent.id).toBe(u.id);
      expect(agent.numero_badge).toBe('BADGE001');
    });

  });

  describe('Utilisateur Queries', () => {

    test('should find utilisateur by email', async () => {
      await Utilisateur.create({ email: 'search@ecotrack.com', role: 'citoyen' });
      const found = await Utilisateur.findOne({ where: { email: 'search@ecotrack.com' } });
      expect(found).not.toBeNull();
      expect(found.email).toBe('search@ecotrack.com');
    });

    test('should update utilisateur', async () => {
      const u = await Utilisateur.create({ email: 'update@ecotrack.com', role: 'agent', nom: 'Original' });
      await u.update({ nom: 'Updated' });
      expect(u.nom).toBe('Updated');
    });

    test('should delete utilisateur', async () => {
      const u = await Utilisateur.create({ email: 'del@ecotrack.com', role: 'citoyen' });
      const id = u.id;
      await u.destroy();
      const found = await Utilisateur.findByPk(id);
      expect(found).toBeNull();
    });

  });

});
