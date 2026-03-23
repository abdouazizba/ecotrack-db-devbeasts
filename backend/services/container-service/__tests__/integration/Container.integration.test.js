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

  describe('Container CRUD Operations', () => {

    test('should create container in zone', async () => {
      const zone = await Zone.create({
        id: 1,
        nom: 'Zone Test',
        latitude: 48.8,
        longitude: 2.3,
        rayon_km: 1
      });

      const container = await Conteneur.create({
        id: 1,
        code_rfid: 'TEST001',
        type: 'RECYCLABLES',
        capacite_litres: 500,
        etat: 'OPERATIONNEL',
        zone_id: 1
      });

      expect(container.zone_id).toBe(1);
      expect(container.etat).toBe('OPERATIONNEL');
    });

    test('should record measurement for container', async () => {
      const container = await Conteneur.create({
        id: 1,
        code_rfid: 'MEASURE001',
        type: 'RECYCLABLES',
        capacite_litres: 1000
      });

      const mesure = await Mesure.create({
        id: 1,
        conteneur_id: 1,
        taux_remplissage: 75.5,
        temperature: 22.5,
        humidite: 45.2,
        date_mesure: new Date()
      });

      expect(mesure.conteneur_id).toBe(1);
      expect(mesure.taux_remplissage).toBe(75.5);
    });

    test('should update container state based on measurements', async () => {
      const container = await Conteneur.create({
        id: 1,
        code_rfid: 'STATE001',
        type: 'RECYCLABLES',
        capacite_litres: 1000,
        etat: 'OPERATIONNEL'
      });

      // High fill level triggers state change
      const mesure = await Mesure.create({
        id: 1,
        conteneur_id: 1,
        taux_remplissage: 95.0,
        temperature: 25.0,
        humidite: 50.0
      });

      if (mesure.taux_remplissage > 90) {
        await container.update({ etat: 'PLEIN' });
      }

      const updated = await Conteneur.findByPk(1);
      expect(updated.etat).toBe('PLEIN');
    });

  });

  describe('Measurement Data Integrity', () => {

    test('should validate measurement constraints', async () => {
      const container = await Conteneur.create({
        id: 1,
        code_rfid: 'VALID001',
        type: 'RECYCLABLES',
        capacite_litres: 1000
      });

      const mesure = await Mesure.create({
        id: 1,
        conteneur_id: 1,
        taux_remplissage: 50.0,
        temperature: 20.0,
        humidite: 40.0
      });

      // Validate ranges
      expect(mesure.taux_remplissage).toBeGreaterThanOrEqual(0);
      expect(mesure.taux_remplissage).toBeLessThanOrEqual(100);
      expect(mesure.temperature).toBeGreaterThan(-50);
      expect(mesure.temperature).toBeLessThan(80);
    });

    test('should persist container and measurement data', async () => {
      const container = await Conteneur.create({
        id: 1,
        code_rfid: 'PERSIST001',
        type: 'RECYCLABLES',
        capacite_litres: 1000
      });

      const mesure = await Mesure.create({
        id: 1,
        conteneur_id: 1,
        taux_remplissage: 60.0,
        temperature: 21.0,
        humidite: 42.0,
        date_mesure: new Date()
      });

      const foundContainer = await Conteneur.findByPk(1);
      const foundMesure = await Mesure.findByPk(1);

      expect(foundContainer.code_rfid).toBe('PERSIST001');
      expect(foundMesure.taux_remplissage).toBe(60.0);
    });

  });

  describe('Zone Container Relationship', () => {

    test('should retrieve all containers in a zone', async () => {
      const zone = await Zone.create({
        id: 1,
        nom: 'Zone Relationship',
        latitude: 48.8,
        longitude: 2.3,
        rayon_km: 2
      });

      await Conteneur.create({
        id: 1,
        code_rfid: 'REL001',
        type: 'RECYCLABLES',
        zone_id: 1
      });

      await Conteneur.create({
        id: 2,
        code_rfid: 'REL002',
        type: 'DECHETS',
        zone_id: 1
      });

      const containers = await Conteneur.findAll({ where: { zone_id: 1 } });
      expect(containers.length).toBe(2);
    });

  });

});
