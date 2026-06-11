const { Tournee, sequelize } = require('../../src/models');

describe('Tour Service Integration Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Tournee.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Tournee CRUD Operations', () => {

    test('should create a tournee', async () => {
      const tournee = await Tournee.create({
        code: 'CRUD001',
        date: new Date(),
        statut: 'PLANIFIÉE',
      });

      expect(tournee.code).toBe('CRUD001');
      expect(tournee.statut).toBe('PLANIFIÉE');
      expect(tournee.id).toBeDefined();
    });

    test('should transition tournee through states', async () => {
      const tournee = await Tournee.create({
        code: 'STATE001',
        date: new Date(),
        statut: 'PLANIFIÉE',
      });

      await tournee.update({ statut: 'EN_COURS' });
      let updated = await Tournee.findByPk(tournee.id);
      expect(updated.statut).toBe('EN_COURS');

      await tournee.update({ statut: 'TERMINÉE' });
      updated = await Tournee.findByPk(tournee.id);
      expect(updated.statut).toBe('TERMINÉE');
    });

    test('should cancel tournee', async () => {
      const tournee = await Tournee.create({
        code: 'CANCEL001',
        date: new Date(),
        statut: 'PLANIFIÉE',
      });

      await tournee.update({ statut: 'ANNULÉE' });
      const updated = await Tournee.findByPk(tournee.id);
      expect(updated.statut).toBe('ANNULÉE');
    });

  });

  describe('Tournee Querying', () => {

    test('should retrieve tournees by statut', async () => {
      await Tournee.create({ code: 'Q001', date: new Date(), statut: 'PLANIFIÉE' });
      await Tournee.create({ code: 'Q002', date: new Date(), statut: 'PLANIFIÉE' });
      await Tournee.create({ code: 'Q003', date: new Date(), statut: 'EN_COURS' });

      const planned = await Tournee.findAll({ where: { statut: 'PLANIFIÉE' } });
      expect(planned.length).toBe(2);

      const ongoing = await Tournee.findAll({ where: { statut: 'EN_COURS' } });
      expect(ongoing.length).toBe(1);
    });

    test('should enforce unique code constraint', async () => {
      await Tournee.create({ code: 'UNIQUE001', date: new Date(), statut: 'PLANIFIÉE' });

      await expect(
        Tournee.create({ code: 'UNIQUE001', date: new Date(), statut: 'EN_COURS' })
      ).rejects.toBeDefined();
    });

  });

  describe('Tournee Data Persistence', () => {

    test('should persist tournee data in database', async () => {
      const tourDate = new Date('2024-02-10');
      const created = await Tournee.create({
        code: 'PERSIST001',
        date: tourDate,
        statut: 'PLANIFIÉE',
        notes: 'Test persistence',
      });

      const retrieved = await Tournee.findByPk(created.id);
      expect(retrieved.code).toBe('PERSIST001');
      expect(retrieved.statut).toBe('PLANIFIÉE');
      expect(retrieved.notes).toBe('Test persistence');
    });

  });

});
