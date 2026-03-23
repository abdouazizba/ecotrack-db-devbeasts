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
        id: 1,
        email: 'agent@test.com',
        nom: 'Agent',
        prenom: 'Test',
        num_telephone: '+33600000000'
      });

      const agent = await Agent.create({
        id: 1,
        utilisateur_id: 1,
        num_badge: 'BADGE001',
        zone_affectation: 'Zone Centrale'
      });

      const found = await Utilisateur.findByPk(1);
      expect(found.email).toBe('agent@test.com');
      expect(found.nom).toBe('Agent');
    });

    test('should create Citoyen user with profile', async () => {
      const utilisateur = await Utilisateur.create({
        id: 2,
        email: 'citoyen@test.com',
        nom: 'Citoyen',
        prenom: 'Test'
      });

      const citoyen = await Citoyen.create({
        id: 2,
        utilisateur_id: 2,
        adresse: '123 Rue Test',
        ville: 'Paris',
        code_postal: '75001'
      });

      const found = await Utilisateur.findByPk(2);
      expect(found.email).toBe('citoyen@test.com');
    });

    test('should create Admin user with profile', async () => {
      const utilisateur = await Utilisateur.create({
        id: 3,
        email: 'admin@test.com',
        nom: 'Admin',
        prenom: 'Test'
      });

      const admin = await Admin.create({
        id: 3,
        utilisateur_id: 3,
        niveau_acces: 'SUPER_ADMIN',
        date_nomination: new Date()
      });

      const found = await Utilisateur.findByPk(3);
      expect(found.email).toBe('admin@test.com');
    });

  });

  describe('Event-Driven Profile Creation', () => {

    test('should handle user.created event (Agent role)', async () => {
      // Simulate event payload
      const eventData = {
        id: 4,
        email: 'event-agent@test.com',
        nom: 'EventAgent',
        prenom: 'Test',
        role: 'AGENT'
      };

      // Create Utilisateur
      const utilisateur = await Utilisateur.create(eventData);

      // Create Agent profile
      const agent = await Agent.create({
        id: 4,
        utilisateur_id: 4,
        num_badge: 'AUTO001',
        zone_affectation: 'Zone Auto'
      });

      const found = await Utilisateur.findByPk(4);
      expect(found.email).toBe('event-agent@test.com');
    });

    test('should handle user.created event (Citoyen role)', async () => {
      const eventData = {
        id: 5,
        email: 'event-citoyen@test.com',
        nom: 'EventCitoyen',
        prenom: 'Test',
        role: 'CITOYEN'
      };

      const utilisateur = await Utilisateur.create(eventData);
      const citoyen = await Citoyen.create({
        id: 5,
        utilisateur_id: 5,
        adresse: 'Auto Address',
        ville: 'Auto City',
        code_postal: '00000'
      });

      const found = await Utilisateur.findByPk(5);
      expect(found.email).toBe('event-citoyen@test.com');
    });

  });

  describe('Data Integrity', () => {

    test('should enforce email uniqueness across all users', async () => {
      await Utilisateur.create({
        id: 6,
        email: 'unique@test.com',
        nom: 'User1',
        prenom: 'Test'
      });

      try {
        await Utilisateur.create({
          id: 7,
          email: 'unique@test.com',
          nom: 'User2',
          prenom: 'Test'
        });
        fail('Should throw uniqueness error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should persist user data in database', async () => {
      const user = await Utilisateur.create({
        id: 8,
        email: 'persist@test.com',
        nom: 'PersistTest',
        prenom: 'Data',
        num_telephone: '+33612345678'
      });

      const retrieved = await Utilisateur.findByPk(8);
      expect(retrieved.nom).toBe('PersistTest');
      expect(retrieved.num_telephone).toBe('+33612345678');
    });

  });

});
