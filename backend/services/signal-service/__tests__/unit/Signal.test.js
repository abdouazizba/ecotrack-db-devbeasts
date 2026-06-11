const { Signalement, sequelize } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');

describe('Signalement Model - Unit Tests', () => {

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
    description: 'Conteneur saturé',
    id_conteneur: uuidv4(),
    latitude: 14.6928,
    longitude: -17.4467,
    ...overrides,
  });

  describe('Signal Creation', () => {

    test('should create a new signalement', async () => {
      const s = await makeSignal();
      expect(s.id).toBeDefined();
      expect(s.type).toBe('CONTENEUR_PLEIN');
      expect(s.statut).toBe('OUVERT');
    });

  });

  describe('Signal Types', () => {

    test('should support all signal types', async () => {
      const types = ['CONTENEUR_PLEIN', 'CONTENEUR_ENDOMMAGÉ', 'MAUVAISE_ODEUR', 'DÉBORDEMENT', 'AUTRE'];
      for (const type of types) {
        const s = await makeSignal({ type, id_conteneur: uuidv4() });
        expect(s.type).toBe(type);
        await s.destroy();
      }
    });

  });

  describe('Signal States', () => {

    test('should support all signal statuts', async () => {
      const statuts = ['OUVERT', 'EN_COURS_DE_TRAITEMENT', 'FERMÉ', 'REJETÉ'];
      for (const statut of statuts) {
        const s = await makeSignal({ statut, id_conteneur: uuidv4() });
        expect(s.statut).toBe(statut);
        await s.destroy();
      }
    });

  });

  describe('Signal Queries', () => {

    test('should find signal by id_utilisateur', async () => {
      const uid = uuidv4();
      await makeSignal({ id_utilisateur: uid });
      const found = await Signalement.findAll({ where: { id_utilisateur: uid } });
      expect(found.length).toBeGreaterThan(0);
    });

    test('should update signal statut', async () => {
      const s = await makeSignal();
      await s.update({ statut: 'EN_COURS_DE_TRAITEMENT' });
      expect(s.statut).toBe('EN_COURS_DE_TRAITEMENT');
    });

  });

});
