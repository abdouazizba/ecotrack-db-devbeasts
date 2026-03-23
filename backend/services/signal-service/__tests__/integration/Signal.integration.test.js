const { Signal, sequelize } = require('../../src/models');

describe('Signal Service Integration Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Signal.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Signal CRUD Operations', () => {

    test('should create signal from citizen', async () => {
      const signal = await Signal.create({
        id: 1,
        citoyen_id: 1,
        titre: 'Conteneur plein',
        description: 'Le conteneur à la gare est complètement plein',
        type: 'PROBLEME',
        latitude: 48.8566,
        longitude: 2.3522,
        statut: 'OUVERTE'
      });

      expect(signal.citoyen_id).toBe(1);
      expect(signal.type).toBe('PROBLEME');
      expect(signal.statut).toBe('OUVERTE');
    });

    test('should transition signal through states', async () => {
      const signal = await Signal.create({
        id: 1,
        citoyen_id: 1,
        titre: 'Problème',
        description: 'Description',
        type: 'PROBLEME',
        latitude: 48.8,
        longitude: 2.3,
        statut: 'OUVERTE'
      });

      // Transition: OUVERTE -> EN_COURS
      await signal.update({ statut: 'EN_COURS' });
      let updated = await Signal.findByPk(1);
      expect(updated.statut).toBe('EN_COURS');

      // Transition: EN_COURS -> RESOLUE
      await signal.update({ statut: 'RESOLUE' });
      updated = await Signal.findByPk(1);
      expect(updated.statut).toBe('RESOLUE');

      // Transition: RESOLUE -> FERMEE
      await signal.update({ statut: 'FERMEE' });
      updated = await Signal.findByPk(1);
      expect(updated.statut).toBe('FERMEE');
    });

    test('should retrieve signals by citizen', async () => {
      const citizenId = 2;

      await Signal.create({
        id: 1,
        citoyen_id: citizenId,
        titre: 'Signal 1',
        description: 'Desc 1',
        type: 'PROBLEME',
        latitude: 48.8,
        longitude: 2.3,
        statut: 'OUVERTE'
      });

      await Signal.create({
        id: 2,
        citoyen_id: citizenId,
        titre: 'Signal 2',
        description: 'Desc 2',
        type: 'SUGGESTION',
        latitude: 48.9,
        longitude: 2.4,
        statut: 'OUVERTE'
      });

      const signals = await Signal.findAll({ where: { citoyen_id: citizenId } });
      expect(signals.length).toBe(2);
    });

  });

  describe('Signal Filtering', () => {

    test('should retrieve open signals', async () => {
      await Signal.create({
        id: 1,
        citoyen_id: 1,
        titre: 'Open',
        description: 'Desc',
        type: 'PROBLEME',
        latitude: 48.8,
        longitude: 2.3,
        statut: 'OUVERTE'
      });

      await Signal.create({
        id: 2,
        citoyen_id: 1,
        titre: 'Closed',
        description: 'Desc',
        type: 'PROBLEME',
        latitude: 48.8,
        longitude: 2.3,
        statut: 'FERMEE'
      });

      const openSignals = await Signal.findAll({ where: { statut: 'OUVERTE' } });
      expect(openSignals.length).toBe(1);
      expect(openSignals[0].titre).toBe('Open');
    });

    test('should retrieve signals by type', async () => {
      await Signal.create({
        id: 1,
        citoyen_id: 1,
        titre: 'Problem',
        description: 'Desc',
        type: 'PROBLEME',
        latitude: 48.8,
        longitude: 2.3,
        statut: 'OUVERTE'
      });

      await Signal.create({
        id: 2,
        citoyen_id: 1,
        titre: 'Suggestion',
        description: 'Desc',
        type: 'SUGGESTION',
        latitude: 48.8,
        longitude: 2.3,
        statut: 'OUVERTE'
      });

      const problems = await Signal.findAll({ where: { type: 'PROBLEME' } });
      expect(problems.length).toBe(1);
      expect(problems[0].type).toBe('PROBLEME');
    });

  });

  describe('Signal Data Persistence', () => {

    test('should persist signal with location', async () => {
      const signal = await Signal.create({
        id: 1,
        citoyen_id: 1,
        titre: 'Persist Test',
        description: 'Full description',
        type: 'PROBLEME',
        latitude: 48.8566,
        longitude: 2.3522,
        statut: 'OUVERTE'
      });

      const retrieved = await Signal.findByPk(1);
      expect(retrieved.latitude).toBe(48.8566);
      expect(retrieved.longitude).toBe(2.3522);
      expect(retrieved.titre).toBe('Persist Test');
    });

  });

});
