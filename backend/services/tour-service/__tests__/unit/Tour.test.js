const { Tournee, sequelize } = require('../../src/models');

describe('Tournee Model - Unit Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Tournee.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Tournee Creation', () => {

    test('should create a new tournee', async () => {
      const t = await Tournee.create({
        code: 'TOUR001',
        date: new Date(),
        statut: 'PLANIFIÉE',
      });
      expect(t.id).toBeDefined();
      expect(t.code).toBe('TOUR001');
      expect(t.statut).toBe('PLANIFIÉE');
    });

    test('should enforce code uniqueness', async () => {
      await Tournee.create({ code: 'UNIQUE001', date: new Date() });
      await expect(
        Tournee.create({ code: 'UNIQUE001', date: new Date() })
      ).rejects.toThrow();
    });

  });

  describe('Tournee States', () => {

    test('should support all statuts', async () => {
      const statuts = ['PLANIFIÉE', 'EN_COURS', 'TERMINÉE', 'ANNULÉE'];
      for (const statut of statuts) {
        const t = await Tournee.create({ code: `TOUR_${statut.replace('É', 'E').replace('Â', 'A')}`, date: new Date(), statut });
        expect(t.statut).toBe(statut);
        await t.destroy();
      }
    });

  });

  describe('Tournee Queries', () => {

    test('should find tournee by code', async () => {
      await Tournee.create({ code: 'SEARCH001', date: new Date() });
      const found = await Tournee.findOne({ where: { code: 'SEARCH001' } });
      expect(found).not.toBeNull();
      expect(found.code).toBe('SEARCH001');
    });

    test('should update tournee statut', async () => {
      const t = await Tournee.create({ code: 'UPDATE001', date: new Date() });
      await t.update({ statut: 'EN_COURS' });
      expect(t.statut).toBe('EN_COURS');
    });

    test('should retrieve tournees by statut', async () => {
      await Tournee.create({ code: 'PLAN001', date: new Date(), statut: 'PLANIFIÉE' });
      await Tournee.create({ code: 'PLAN002', date: new Date(), statut: 'PLANIFIÉE' });
      await Tournee.create({ code: 'DONE001', date: new Date(), statut: 'TERMINÉE' });
      const planned = await Tournee.findAll({ where: { statut: 'PLANIFIÉE' } });
      expect(planned.length).toBe(2);
    });

  });

});
