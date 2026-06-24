const { Vehicule, sequelize } = require('../../src/models');

describe('Vehicule Model - Unit Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Vehicule.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Vehicule Creation', () => {

    test('should create a new vehicule', async () => {
      const v = await Vehicule.create({
        immatriculation: 'AB-123-CD',
        marque: 'Renault',
        modele: 'Midlum 220',
        type_vehicule: 'BENNE',
        capacite_tonnes: 12,
        kilometrage: 45000,
      });
      expect(v.id).toBeDefined();
      expect(v.immatriculation).toBe('AB-123-CD');
      expect(v.marque).toBe('Renault');
      expect(v.type_vehicule).toBe('BENNE');
      expect(v.statut).toBe('ACTIF');
    });

    test('should enforce immatriculation uniqueness', async () => {
      await Vehicule.create({ immatriculation: 'XX-999-YY', marque: 'Volvo' });
      await expect(
        Vehicule.create({ immatriculation: 'XX-999-YY', marque: 'MAN' })
      ).rejects.toThrow();
    });

    test('should require immatriculation', async () => {
      await expect(
        Vehicule.create({ marque: 'Renault' })
      ).rejects.toThrow();
    });

    test('should require marque', async () => {
      await expect(
        Vehicule.create({ immatriculation: 'ZZ-000-AA' })
      ).rejects.toThrow();
    });

    test('should default statut to ACTIF', async () => {
      const v = await Vehicule.create({ immatriculation: 'DD-111-EE', marque: 'Iveco' });
      expect(v.statut).toBe('ACTIF');
    });

    test('should default kilometrage to 0', async () => {
      const v = await Vehicule.create({ immatriculation: 'FF-222-GG', marque: 'DAF' });
      expect(v.kilometrage).toBe(0);
    });

    test('should default type_vehicule to BENNE', async () => {
      const v = await Vehicule.create({ immatriculation: 'HH-333-JJ', marque: 'Scania' });
      expect(v.type_vehicule).toBe('BENNE');
    });

  });

  describe('Vehicule Types', () => {

    test('should support all vehicle types', async () => {
      const types = ['BENNE', 'COMPACTEUR', 'UTILITAIRE', 'CAMION_GRUE'];
      for (const type of types) {
        const v = await Vehicule.create({
          immatriculation: `TYPE-${type.slice(0, 4)}`,
          marque: 'Test',
          type_vehicule: type,
        });
        expect(v.type_vehicule).toBe(type);
        await v.destroy();
      }
    });

  });

  describe('Vehicule Statuts', () => {

    test('should support all statuts', async () => {
      const statuts = ['ACTIF', 'INACTIF', 'EN_MAINTENANCE'];
      for (const statut of statuts) {
        const v = await Vehicule.create({
          immatriculation: `STAT-${statut.slice(0, 4)}`,
          marque: 'Test',
          statut,
        });
        expect(v.statut).toBe(statut);
        await v.destroy();
      }
    });

  });

  describe('Vehicule Queries', () => {

    test('should find vehicule by immatriculation', async () => {
      await Vehicule.create({ immatriculation: 'FIND-001', marque: 'Mercedes' });
      const found = await Vehicule.findOne({ where: { immatriculation: 'FIND-001' } });
      expect(found).not.toBeNull();
      expect(found.marque).toBe('Mercedes');
    });

    test('should update vehicule kilometrage', async () => {
      const v = await Vehicule.create({ immatriculation: 'KM-001', marque: 'Volvo', kilometrage: 10000 });
      await v.update({ kilometrage: 15000 });
      const updated = await Vehicule.findByPk(v.id);
      expect(updated.kilometrage).toBe(15000);
    });

    test('should filter vehicules by statut', async () => {
      await Vehicule.create({ immatriculation: 'ACT-001', marque: 'Renault', statut: 'ACTIF' });
      await Vehicule.create({ immatriculation: 'ACT-002', marque: 'MAN', statut: 'ACTIF' });
      await Vehicule.create({ immatriculation: 'MAINT-001', marque: 'Iveco', statut: 'EN_MAINTENANCE' });

      const actifs = await Vehicule.findAll({ where: { statut: 'ACTIF' } });
      expect(actifs.length).toBe(2);

      const maintenance = await Vehicule.findAll({ where: { statut: 'EN_MAINTENANCE' } });
      expect(maintenance.length).toBe(1);
    });

    test('should filter vehicules by type_vehicule', async () => {
      await Vehicule.create({ immatriculation: 'BEN-001', marque: 'Renault', type_vehicule: 'BENNE' });
      await Vehicule.create({ immatriculation: 'COM-001', marque: 'Mercedes', type_vehicule: 'COMPACTEUR' });

      const bennes = await Vehicule.findAll({ where: { type_vehicule: 'BENNE' } });
      expect(bennes.length).toBe(1);
    });

    test('should delete vehicule', async () => {
      const v = await Vehicule.create({ immatriculation: 'DEL-001', marque: 'DAF' });
      await v.destroy();
      const found = await Vehicule.findByPk(v.id);
      expect(found).toBeNull();
    });

  });

});
