const { Utilisateur, Agent, sequelize } = require('../../src/models');

describe('Utilisateur Model - Unit Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Utilisateur.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Utilisateur Creation', () => {

    test('should create a new Utilisateur', async () => {
      const utilisateur = await Utilisateur.create({
        id: 1,
        email: 'agent@ecotrack.com',
        nom: 'Agent Test',
        prenom: 'Test',
        num_telephone: '+33612345678'
      });

      expect(utilisateur.id).toBe(1);
      expect(utilisateur.email).toBe('agent@ecotrack.com');
      expect(utilisateur.nom).toBe('Agent Test');
    });

    test('should enforce email uniqueness', async () => {
      await Utilisateur.create({
        id: 1,
        email: 'duplicate@ecotrack.com',
        nom: 'First',
        prenom: 'User'
      });

      try {
        await Utilisateur.create({
          id: 2,
          email: 'duplicate@ecotrack.com',
          nom: 'Second',
          prenom: 'User'
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

  });

  describe('Agent Creation', () => {

    test('should create Agent with Utilisateur parent', async () => {
      const utilisateur = await Utilisateur.create({
        id: 1,
        email: 'agent@ecotrack.com',
        nom: 'Agent',
        prenom: 'Test'
      });

      const agent = await Agent.create({
        id: 1,
        utilisateur_id: 1,
        num_badge: 'BADGE001',
        zone_affectation: 'Zone A'
      });

      expect(agent.utilisateur_id).toBe(1);
      expect(agent.num_badge).toBe('BADGE001');
    });

  });

  describe('Utilisateur Queries', () => {

    test('should find Utilisateur by email', async () => {
      await Utilisateur.create({
        id: 1,
        email: 'search@ecotrack.com',
        nom: 'Search',
        prenom: 'Test'
      });

      const found = await Utilisateur.findOne({ where: { email: 'search@ecotrack.com' } });
      expect(found).toBeDefined();
      expect(found.email).toBe('search@ecotrack.com');
    });

    test('should update Utilisateur', async () => {
      const utilisateur = await Utilisateur.create({
        id: 1,
        email: 'update@ecotrack.com',
        nom: 'Original',
        prenom: 'Name'
      });

      await utilisateur.update({ nom: 'Updated' });
      expect(utilisateur.nom).toBe('Updated');
    });

    test('should delete Utilisateur', async () => {
      const utilisateur = await Utilisateur.create({
        id: 1,
        email: 'delete@ecotrack.com',
        nom: 'Delete',
        prenom: 'Me'
      });

      await utilisateur.destroy();
      const found = await Utilisateur.findByPk(1);
      expect(found).toBeNull();
    });

  });

});
