const { Signalement, sequelize } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');

describe('Signal Service Integration Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Signalement.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const makeSignal = (overrides = {}) => Signalement.create({
    type: 'CONTENEUR_PLEIN',
    description: 'Le conteneur à la gare est saturé',
    id_conteneur: uuidv4(),
    latitude: 14.6928,
    longitude: -17.4467,
    ...overrides,
  });

  describe('Signal CRUD Operations', () => {

    test('should create signal from citizen', async () => {
      const uid = uuidv4();
      const s = await makeSignal({ id_utilisateur: uid });
      expect(s.id).toBeDefined();
      expect(s.type).toBe('CONTENEUR_PLEIN');
      expect(s.statut).toBe('OUVERT');
    });

    test('should transition signal through states', async () => {
      const s = await makeSignal();

      await s.update({ statut: 'EN_COURS_DE_TRAITEMENT' });
      let updated = await Signalement.findByPk(s.id);
      expect(updated.statut).toBe('EN_COURS_DE_TRAITEMENT');

      await s.update({ statut: 'FERMÉ' });
      updated = await Signalement.findByPk(s.id);
      expect(updated.statut).toBe('FERMÉ');
    });

    test('should retrieve signals by utilisateur', async () => {
      const uid = uuidv4();
      await makeSignal({ id_utilisateur: uid });
      await makeSignal({ id_utilisateur: uid, id_conteneur: uuidv4() });
      const signals = await Signalement.findAll({ where: { id_utilisateur: uid } });
      expect(signals.length).toBe(2);
    });

  });

  describe('Signal Filtering', () => {

    test('should retrieve open signals', async () => {
      await makeSignal({ statut: 'OUVERT' });
      await makeSignal({ statut: 'FERMÉ', id_conteneur: uuidv4() });
      const open = await Signalement.findAll({ where: { statut: 'OUVERT' } });
      expect(open.length).toBe(1);
    });

    test('should retrieve signals by type', async () => {
      await makeSignal({ type: 'CONTENEUR_PLEIN' });
      await makeSignal({ type: 'MAUVAISE_ODEUR', id_conteneur: uuidv4() });
      const results = await Signalement.findAll({ where: { type: 'MAUVAISE_ODEUR' } });
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('MAUVAISE_ODEUR');
    });

  });

  describe('Signal Data Persistence', () => {

    test('should persist signal with location', async () => {
      const s = await makeSignal({ latitude: 14.6928, longitude: -17.4467 });
      const retrieved = await Signalement.findByPk(s.id);
      expect(parseFloat(retrieved.latitude)).toBeCloseTo(14.6928, 3);
      expect(parseFloat(retrieved.longitude)).toBeCloseTo(-17.4467, 3);
    });

  });

});
