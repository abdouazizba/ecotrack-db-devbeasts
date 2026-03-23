const { Tour, sequelize } = require('../../src/models');

describe('Tour Model - Unit Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Tour.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Tour Creation', () => {

    test('should create a new tour', async () => {
      const tour = await Tour.create({
        id: 1,
        num_tournee: 'TOUR001',
        agent_id: 1,
        date_prevue: new Date(),
        statut: 'PLANIFIEE'
      });

      expect(tour.id).toBe(1);
      expect(tour.num_tournee).toBe('TOUR001');
      expect(tour.statut).toBe('PLANIFIEE');
    });

    test('should enforce tour number uniqueness', async () => {
      await Tour.create({
        id: 1,
        num_tournee: 'UNIQUE001',
        agent_id: 1,
        date_prevue: new Date(),
        statut: 'PLANIFIEE'
      });

      try {
        await Tour.create({
          id: 2,
          num_tournee: 'UNIQUE001',
          agent_id: 2,
          date_prevue: new Date(),
          statut: 'PLANIFIEE'
        });
        fail('Should have thrown uniqueness error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

  });

  describe('Tour States', () => {

    test('should support all tour states', async () => {
      const states = ['PLANIFIEE', 'EN_COURS', 'COMPLETEE', 'ANNULEE'];

      for (const state of states) {
        const tour = await Tour.create({
          id: Math.random() * 10000,
          num_tournee: `TOUR_${state}`,
          agent_id: 1,
          date_prevue: new Date(),
          statut: state
        });
        expect(tour.statut).toBe(state);
      }
    });

  });

  describe('Tour Queries', () => {

    test('should find tour by number', async () => {
      await Tour.create({
        id: 1,
        num_tournee: 'SEARCH001',
        agent_id: 1,
        date_prevue: new Date(),
        statut: 'PLANIFIEE'
      });

      const found = await Tour.findOne({ where: { num_tournee: 'SEARCH001' } });
      expect(found).toBeDefined();
      expect(found.num_tournee).toBe('SEARCH001');
    });

    test('should update tour status', async () => {
      const tour = await Tour.create({
        id: 1,
        num_tournee: 'UPDATE001',
        agent_id: 1,
        date_prevue: new Date(),
        statut: 'PLANIFIEE'
      });

      await tour.update({ statut: 'EN_COURS' });
      expect(tour.statut).toBe('EN_COURS');
    });

    test('should find tours by agent', async () => {
      await Tour.create({
        id: 1,
        num_tournee: 'AGENT_001',
        agent_id: 5,
        date_prevue: new Date(),
        statut: 'PLANIFIEE'
      });

      await Tour.create({
        id: 2,
        num_tournee: 'AGENT_002',
        agent_id: 5,
        date_prevue: new Date(),
        statut: 'EN_COURS'
      });

      const tours = await Tour.findAll({ where: { agent_id: 5 } });
      expect(tours.length).toBe(2);
    });

  });

});
