const { Tour, sequelize } = require('../../src/models');

describe('Tour Service Integration Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Tour.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Tour CRUD Operations', () => {

    test('should create tour for agent', async () => {
      const tour = await Tour.create({
        id: 1,
        num_tournee: 'CRUD001',
        agent_id: 1,
        date_prevue: new Date('2024-01-15'),
        statut: 'PLANIFIEE'
      });

      expect(tour.agent_id).toBe(1);
      expect(tour.statut).toBe('PLANIFIEE');
    });

    test('should transition tour through states', async () => {
      const tour = await Tour.create({
        id: 1,
        num_tournee: 'STATE001',
        agent_id: 1,
        date_prevue: new Date(),
        statut: 'PLANIFIEE'
      });

      // Transition: PLANIFIEE -> EN_COURS
      await tour.update({ statut: 'EN_COURS' });
      let updated = await Tour.findByPk(1);
      expect(updated.statut).toBe('EN_COURS');

      // Transition: EN_COURS -> COMPLETEE
      await tour.update({ statut: 'COMPLETEE' });
      updated = await Tour.findByPk(1);
      expect(updated.statut).toBe('COMPLETEE');
    });

    test('should cancel tour', async () => {
      const tour = await Tour.create({
        id: 1,
        num_tournee: 'CANCEL001',
        agent_id: 1,
        date_prevue: new Date(),
        statut: 'PLANIFIEE'
      });

      await tour.update({ statut: 'ANNULEE' });
      expect(tour.statut).toBe('ANNULEE');
    });

  });

  describe('Tour Scheduling', () => {

    test('should retrieve tours by date', async () => {
      const testDate = new Date('2024-01-20');

      await Tour.create({
        id: 1,
        num_tournee: 'DATE001',
        agent_id: 1,
        date_prevue: testDate,
        statut: 'PLANIFIEE'
      });

      await Tour.create({
        id: 2,
        num_tournee: 'DATE002',
        agent_id: 2,
        date_prevue: testDate,
        statut: 'PLANIFIEE'
      });

      const tours = await Tour.findAll({ 
        where: { 
          date_prevue: testDate 
        } 
      });

      expect(tours.length).toBe(2);
    });

    test('should retrieve agent tours', async () => {
      const agentId = 3;

      await Tour.create({
        id: 1,
        num_tournee: 'AGENT_001',
        agent_id: agentId,
        date_prevue: new Date(),
        statut: 'PLANIFIEE'
      });

      await Tour.create({
        id: 2,
        num_tournee: 'AGENT_002',
        agent_id: agentId,
        date_prevue: new Date(),
        statut: 'EN_COURS'
      });

      const agentTours = await Tour.findAll({ where: { agent_id: agentId } });
      expect(agentTours.length).toBe(2);
      expect(agentTours.every(t => t.agent_id === agentId)).toBe(true);
    });

  });

  describe('Tour Data Persistence', () => {

    test('should persist tour data in database', async () => {
      const tourDate = new Date('2024-02-10');

      const tour = await Tour.create({
        id: 1,
        num_tournee: 'PERSIST001',
        agent_id: 1,
        date_prevue: tourDate,
        statut: 'PLANIFIEE'
      });

      const retrieved = await Tour.findByPk(1);
      expect(retrieved.num_tournee).toBe('PERSIST001');
      expect(retrieved.agent_id).toBe(1);
      expect(retrieved.statut).toBe('PLANIFIEE');
    });

  });

});
