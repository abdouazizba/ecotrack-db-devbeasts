const { Conteneur, Zone, sequelize } = require('../../src/models');

describe('Container Model - Unit Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Conteneur.destroy({ where: {} });
    await Zone.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Container Creation', () => {

    test('should create a new container', async () => {
      const container = await Conteneur.create({
        id: 1,
        code_rfid: 'CONT001',
        type: 'RECYCLABLES',
        capacite_litres: 1000,
        etat: 'OPERATIONNEL'
      });

      expect(container.id).toBe(1);
      expect(container.code_rfid).toBe('CONT001');
      expect(container.type).toBe('RECYCLABLES');
      expect(container.capacite_litres).toBe(1000);
    });

    test('should enforce code_rfid uniqueness', async () => {
      await Conteneur.create({
        id: 1,
        code_rfid: 'UNIQUE001',
        type: 'RECYCLABLES',
        capacite_litres: 500
      });

      try {
        await Conteneur.create({
          id: 2,
          code_rfid: 'UNIQUE001',
          type: 'DECHETS',
          capacite_litres: 500
        });
        fail('Should have thrown uniqueness error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

  });

  describe('Zone Association', () => {

    test('should associate container with zone', async () => {
      const zone = await Zone.create({
        id: 1,
        nom: 'Zone Centrale',
        latitude: 48.8566,
        longitude: 2.3522,
        rayon_km: 5
      });

      const container = await Conteneur.create({
        id: 1,
        code_rfid: 'CONT002',
        type: 'RECYCLABLES',
        capacite_litres: 1000,
        zone_id: 1
      });

      expect(container.zone_id).toBe(1);
    });

  });

  describe('Container States', () => {

    test('should support all container states', async () => {
      const states = ['OPERATIONNEL', 'EN_MAINTENANCE', 'PLEIN', 'RETIRE'];

      for (const state of states) {
        const container = await Conteneur.create({
          id: Math.random() * 10000,
          code_rfid: `RFID_${state}`,
          type: 'RECYCLABLES',
          capacite_litres: 1000,
          etat: state
        });
        expect(container.etat).toBe(state);
      }
    });

  });

  describe('Container Queries', () => {

    test('should find container by code_rfid', async () => {
      await Conteneur.create({
        id: 1,
        code_rfid: 'SEARCH001',
        type: 'RECYCLABLES',
        capacite_litres: 1000
      });

      const found = await Conteneur.findOne({ where: { code_rfid: 'SEARCH001' } });
      expect(found).toBeDefined();
      expect(found.code_rfid).toBe('SEARCH001');
    });

    test('should update container state', async () => {
      const container = await Conteneur.create({
        id: 1,
        code_rfid: 'UPDATE001',
        type: 'RECYCLABLES',
        capacite_litres: 1000,
        etat: 'OPERATIONNEL'
      });

      await container.update({ etat: 'EN_MAINTENANCE' });
      expect(container.etat).toBe('EN_MAINTENANCE');
    });

  });

});
