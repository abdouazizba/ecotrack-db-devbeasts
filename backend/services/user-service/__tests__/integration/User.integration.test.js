const { Utilisateur, Agent, Citoyen, Admin, sequelize } = require('../../src/models');

describe('User Service Integration Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Utilisateur.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User CRUD Operations', () => {

    test('should create Agent user with profile', async () => {
      const utilisateur = await Utilisateur.create({
        email: 'agent@test.com',
        nom: 'Agent',
        prenom: 'Test',
        role: 'agent',
      });

      const agent = await Agent.create({
        id: utilisateur.id,
        numero_badge: 'BADGE001',
      });

      const found = await Utilisateur.findByPk(utilisateur.id);
      expect(found.email).toBe('agent@test.com');
      expect(found.nom).toBe('Agent');
      expect(agent.id).toBe(utilisateur.id);
    });

    test('should create Citoyen user with profile', async () => {
      const utilisateur = await Utilisateur.create({
        email: 'citoyen@test.com',
        nom: 'Citoyen',
        prenom: 'Test',
        role: 'citoyen',
      });

      const citoyen = await Citoyen.create({
        id: utilisateur.id,
        email_verified: false,
      });

      const found = await Utilisateur.findByPk(utilisateur.id);
      expect(found.email).toBe('citoyen@test.com');
      expect(citoyen.id).toBe(utilisateur.id);
    });

    test('should create Admin user with profile', async () => {
      const utilisateur = await Utilisateur.create({
        email: 'admin@test.com',
        nom: 'Admin',
        prenom: 'Test',
        role: 'admin',
      });

      const admin = await Admin.create({
        id: utilisateur.id,
        niveau_acces: 'admin',
      });

      const found = await Utilisateur.findByPk(utilisateur.id);
      expect(found.email).toBe('admin@test.com');
      expect(admin.id).toBe(utilisateur.id);
    });

  });

  describe('Event-Driven Profile Creation', () => {

    test('should handle user.created event (Agent role)', async () => {
      const utilisateur = await Utilisateur.create({
        email: 'event-agent@test.com',
        nom: 'EventAgent',
        prenom: 'Test',
        role: 'agent',
      });

      const agent = await Agent.create({
        id: utilisateur.id,
        numero_badge: 'AUTO001',
      });

      const found = await Utilisateur.findByPk(utilisateur.id);
      expect(found.email).toBe('event-agent@test.com');
      expect(agent.numero_badge).toBe('AUTO001');
    });

    test('should handle user.created event (Citoyen role)', async () => {
      const utilisateur = await Utilisateur.create({
        email: 'event-citoyen@test.com',
        nom: 'EventCitoyen',
        prenom: 'Test',
        role: 'citoyen',
      });

      const citoyen = await Citoyen.create({
        id: utilisateur.id,
        email_verified: false,
      });

      const found = await Utilisateur.findByPk(utilisateur.id);
      expect(found.email).toBe('event-citoyen@test.com');
      expect(citoyen.email_verified).toBe(false);
    });

  });

  describe('Data Integrity', () => {

    test('should enforce email uniqueness', async () => {
      await Utilisateur.create({
        email: 'unique@test.com',
        nom: 'User1',
        prenom: 'Test',
      });

      await expect(
        Utilisateur.create({
          email: 'unique@test.com',
          nom: 'User2',
          prenom: 'Test',
        })
      ).rejects.toBeDefined();
    });

    test('should persist user data in database', async () => {
      const user = await Utilisateur.create({
        email: 'persist@test.com',
        nom: 'PersistTest',
        prenom: 'Data',
      });

      const retrieved = await Utilisateur.findByPk(user.id);
      expect(retrieved.nom).toBe('PersistTest');
      expect(retrieved.prenom).toBe('Data');
    });

  });

});
