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

  const makeZone = (suffix = 'A') => Zone.create({
    nom: `Zone ${suffix}`,
    code_zone: `ZN${suffix}`,
    latitude: 14.6928,
    longitude: -17.4467,
  });

  const makeConteneur = (id_zone, suffix = '001') => Conteneur.create({
    code_conteneur: `CONT${suffix}`,
    type_conteneur: 'selective',
    capacite: 1000,
    latitude: 14.6928,
    longitude: -17.4467,
    date_installation: new Date(),
    id_zone,
  });

  describe('Container Creation', () => {

    test('should create a new container', async () => {
      const zone = await makeZone();
      const c = await makeConteneur(zone.id);
      expect(c.id).toBeDefined();
      expect(c.code_conteneur).toBe('CONT001');
      expect(c.type_conteneur).toBe('selective');
      expect(c.capacite).toBe(1000);
    });

    test('should enforce code_conteneur uniqueness', async () => {
      const zone = await makeZone('B');
      await makeConteneur(zone.id, '002');
      await expect(makeConteneur(zone.id, '002')).rejects.toThrow();
    });

  });

  describe('Zone Association', () => {

    test('should associate container with zone', async () => {
      const zone = await makeZone('C');
      const c = await makeConteneur(zone.id, '003');
      expect(c.id_zone).toBe(zone.id);
    });

  });

  describe('Container Statuts', () => {

    test('should support all valid statuts', async () => {
      const zone = await makeZone('D');
      const statuts = ['actif', 'maintenance', 'retire'];
      for (const statut of statuts) {
        const c = await Conteneur.create({
          code_conteneur: `ST_${statut}`,
          type_conteneur: 'standard',
          capacite: 500,
          latitude: 14.0,
          longitude: -17.0,
          date_installation: new Date(),
          statut,
          id_zone: zone.id,
        });
        expect(c.statut).toBe(statut);
      }
    });

  });

  describe('Container Queries', () => {

    test('should find container by code_conteneur', async () => {
      const zone = await makeZone('E');
      await makeConteneur(zone.id, 'SEARCH');
      const found = await Conteneur.findOne({ where: { code_conteneur: 'CONTSEARCH' } });
      expect(found).not.toBeNull();
      expect(found.code_conteneur).toBe('CONTSEARCH');
    });

    test('should update container statut', async () => {
      const zone = await makeZone('F');
      const c = await makeConteneur(zone.id, 'UPD');
      await c.update({ statut: 'maintenance' });
      expect(c.statut).toBe('maintenance');
    });

  });

});
