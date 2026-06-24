const { Vehicule, sequelize } = require('../../src/models');

describe('Vehicule Integration Tests', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Vehicule.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Vehicule CRUD Operations', () => {

    test('should create a vehicule with all fields', async () => {
      const v = await Vehicule.create({
        immatriculation: 'CR-001-UD',
        marque: 'Renault',
        modele: 'Midlum 220',
        type_vehicule: 'BENNE',
        capacite_tonnes: 12.5,
        kilometrage: 45000,
        statut: 'ACTIF',
        date_derniere_maintenance: new Date('2026-01-15'),
        date_prochain_controle: new Date('2027-01-15'),
        notes: 'Véhicule en bon état',
      });

      expect(v.immatriculation).toBe('CR-001-UD');
      expect(v.marque).toBe('Renault');
      expect(v.modele).toBe('Midlum 220');
      expect(v.type_vehicule).toBe('BENNE');
      expect(v.capacite_tonnes).toBe(12.5);
      expect(v.kilometrage).toBe(45000);
      expect(v.notes).toBe('Véhicule en bon état');
    });

    test('should update vehicule statut to EN_MAINTENANCE', async () => {
      const v = await Vehicule.create({
        immatriculation: 'UP-001-DT',
        marque: 'Mercedes',
        statut: 'ACTIF',
      });

      await v.update({ statut: 'EN_MAINTENANCE' });
      const updated = await Vehicule.findByPk(v.id);
      expect(updated.statut).toBe('EN_MAINTENANCE');
    });

    test('should record maintenance (update dates and statut)', async () => {
      const v = await Vehicule.create({
        immatriculation: 'MA-001-NT',
        marque: 'Volvo',
        statut: 'EN_MAINTENANCE',
        kilometrage: 80000,
      });

      const now = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      await v.update({
        statut: 'ACTIF',
        date_derniere_maintenance: now,
        date_prochain_controle: nextYear,
        notes: 'Vidange + filtres',
      });

      const updated = await Vehicule.findByPk(v.id);
      expect(updated.statut).toBe('ACTIF');
      expect(updated.notes).toBe('Vidange + filtres');
      expect(updated.date_derniere_maintenance).toBeDefined();
      expect(updated.date_prochain_controle).toBeDefined();
    });

    test('should delete vehicule', async () => {
      const v = await Vehicule.create({
        immatriculation: 'DL-001-ET',
        marque: 'Iveco',
      });

      await v.destroy();
      const found = await Vehicule.findByPk(v.id);
      expect(found).toBeNull();
    });

  });

  describe('Vehicule Data Persistence', () => {

    test('should persist and retrieve vehicule with agent assignment', async () => {
      const agentId = 'aaaaaaaa-0001-0001-0001-000000000002';
      const v = await Vehicule.create({
        immatriculation: 'AG-001-NT',
        marque: 'MAN',
        modele: 'TGS 26.360',
        type_vehicule: 'COMPACTEUR',
        id_agent: agentId,
      });

      const retrieved = await Vehicule.findByPk(v.id);
      expect(retrieved.id_agent).toBe(agentId);
      expect(retrieved.type_vehicule).toBe('COMPACTEUR');
    });

    test('should allow vehicule without agent (nullable id_agent)', async () => {
      const v = await Vehicule.create({
        immatriculation: 'NO-AGT-01',
        marque: 'DAF',
      });

      expect(v.id_agent).toBeNull();
    });

    test('should filter vehicules by agent', async () => {
      const agentId = 'bbbbbbbb-0001-0001-0001-000000000001';
      await Vehicule.create({ immatriculation: 'FLT-001', marque: 'Renault', id_agent: agentId });
      await Vehicule.create({ immatriculation: 'FLT-002', marque: 'Volvo', id_agent: agentId });
      await Vehicule.create({ immatriculation: 'FLT-003', marque: 'MAN', id_agent: null });

      const agentVehicules = await Vehicule.findAll({ where: { id_agent: agentId } });
      expect(agentVehicules.length).toBe(2);
    });

  });

  describe('Vehicule Type Filtering', () => {

    test('should filter by type_vehicule', async () => {
      await Vehicule.create({ immatriculation: 'TYP-BEN', marque: 'Renault', type_vehicule: 'BENNE' });
      await Vehicule.create({ immatriculation: 'TYP-COM', marque: 'Mercedes', type_vehicule: 'COMPACTEUR' });
      await Vehicule.create({ immatriculation: 'TYP-UTI', marque: 'Iveco', type_vehicule: 'UTILITAIRE' });
      await Vehicule.create({ immatriculation: 'TYP-GRU', marque: 'MAN', type_vehicule: 'CAMION_GRUE' });

      const bennes = await Vehicule.findAll({ where: { type_vehicule: 'BENNE' } });
      expect(bennes.length).toBe(1);

      const all = await Vehicule.findAll();
      expect(all.length).toBe(4);
    });

  });

});
