const { Signal, sequelize } = require('../../src/models');

describe('Signal Model - Unit Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Signal.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Signal Creation', () => {

    test('should create a new signal', async () => {
      const signal = await Signal.create({
        id: 1,
        citoyen_id: 1,
        titre: 'Problème conteneur',
        description: 'Le conteneur est endommagé',
        type: 'PROBLEME',
        latitude: 48.8566,
        longitude: 2.3522,
        statut: 'OUVERTE'
      });

      expect(signal.id).toBe(1);
      expect(signal.titre).toBe('Problème conteneur');
      expect(signal.type).toBe('PROBLEME');
      expect(signal.statut).toBe('OUVERTE');
    });

  });

  describe('Signal Types', () => {

    test('should support all signal types', async () => {
      const types = ['PROBLEME', 'SUGGESTION', 'QUESTION', 'DEMANDE_INFO'];

      for (const type of types) {
        const signal = await Signal.create({
          id: Math.random() * 10000,
          citoyen_id: 1,
          titre: `Signal ${type}`,
          description: `Description for ${type}`,
          type: type,
          latitude: 48.8,
          longitude: 2.3,
          statut: 'OUVERTE'
        });
        expect(signal.type).toBe(type);
      }
    });

  });

  describe('Signal States', () => {

    test('should support all signal states', async () => {
      const states = ['OUVERTE', 'EN_COURS', 'RESOLUE', 'FERMEE'];

      for (const state of states) {
        const signal = await Signal.create({
          id: Math.random() * 10000,
          citoyen_id: 1,
          titre: `Signal ${state}`,
          description: `Description`,
          type: 'PROBLEME',
          latitude: 48.8,
          longitude: 2.3,
          statut: state
        });
        expect(signal.statut).toBe(state);
      }
    });

  });

  describe('Signal Queries', () => {

    test('should find signal by citoyen', async () => {
      await Signal.create({
        id: 1,
        citoyen_id: 5,
        titre: 'Signal 1',
        description: 'Description',
        type: 'PROBLEME',
        latitude: 48.8,
        longitude: 2.3,
        statut: 'OUVERTE'
      });

      const found = await Signal.findAll({ where: { citoyen_id: 5 } });
      expect(found.length).toBeGreaterThan(0);
    });

    test('should update signal status', async () => {
      const signal = await Signal.create({
        id: 1,
        citoyen_id: 1,
        titre: 'Update Test',
        description: 'Description',
        type: 'PROBLEME',
        latitude: 48.8,
        longitude: 2.3,
        statut: 'OUVERTE'
      });

      await signal.update({ statut: 'EN_COURS' });
      expect(signal.statut).toBe('EN_COURS');
    });

  });

});
