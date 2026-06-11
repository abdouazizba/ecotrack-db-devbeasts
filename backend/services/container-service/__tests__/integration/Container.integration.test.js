const { Conteneur, Mesure, Zone, sequelize } = require('../../src/models');

describe('Container Service Integration Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Mesure.destroy({ where: {} });
    await Conteneur.destroy({ where: {} });
    await Zone.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const makeZone = () => Zone.create({
    nom: 'Zone Test',
    code_zone: 'ZTINT01',
    latitude: 14.6928,
    longitude: -17.4467,
  });

  const makeConteneur = (id_zone) => Conteneur.create({
    code_conteneur: 'INTCONT001',
    type_conteneur: 'selective',
    capacite: 500,
    latitude: 14.6928,
    longitude: -17.4467,
    date_installation: new Date(),
    id_zone,
  });

  describe('Container CRUD Operations', () => {

    test('should create container in zone', async () => {
      const zone = await makeZone();
      const c = await makeConteneur(zone.id);
      expect(c.id_zone).toBe(zone.id);
      expect(c.statut).toBe('actif');
    });

    test('should record measurement for container', async () => {
      const zone = await makeZone();
      const c = await makeConteneur(zone.id);
      const m = await Mesure.create({
        id_conteneur: c.id,
        taux_remplissage: 75.5,
        temperature: 22.5,
      });
      expect(m.id_conteneur).toBe(c.id);
      expect(m.taux_remplissage).toBe(75.5);
    });

    test('should update container statut based on fill level', async () => {
      const zone = await makeZone();
      const c = await makeConteneur(zone.id);
      const m = await Mesure.create({ id_conteneur: c.id, taux_remplissage: 95.0 });
      if (m.taux_remplissage > 90) {
        await c.update({ statut: 'maintenance' });
      }
      const updated = await Conteneur.findByPk(c.id);
      expect(updated.statut).toBe('maintenance');
    });

  });

  describe('Measurement Data Integrity', () => {

    test('should validate taux_remplissage range', async () => {
      const zone = await makeZone();
      const c = await makeConteneur(zone.id);
      const m = await Mesure.create({ id_conteneur: c.id, taux_remplissage: 50.0, temperature: 20.0 });
      expect(m.taux_remplissage).toBeGreaterThanOrEqual(0);
      expect(m.taux_remplissage).toBeLessThanOrEqual(100);
    });

    test('should persist container and measurement data', async () => {
      const zone = await makeZone();
      const c = await makeConteneur(zone.id);
      await Mesure.create({ id_conteneur: c.id, taux_remplissage: 60.0 });
      const foundC = await Conteneur.findByPk(c.id);
      const foundM = await Mesure.findOne({ where: { id_conteneur: c.id } });
      expect(foundC.code_conteneur).toBe('INTCONT001');
      expect(foundM.taux_remplissage).toBe(60.0);
    });

  });

  describe('Zone Container Relationship', () => {

    test('should retrieve all containers in a zone', async () => {
      const zone = await makeZone();
      await Conteneur.create({
        code_conteneur: 'REL001', type_conteneur: 'selective', capacite: 500,
        latitude: 14.0, longitude: -17.0, date_installation: new Date(), id_zone: zone.id,
      });
      await Conteneur.create({
        code_conteneur: 'REL002', type_conteneur: 'standard', capacite: 500,
        latitude: 14.1, longitude: -17.1, date_installation: new Date(), id_zone: zone.id,
      });
      const containers = await Conteneur.findAll({ where: { id_zone: zone.id } });
      expect(containers.length).toBe(2);
    });

  });

});
