const { Vehicule } = require('../models');
const { Op } = require('sequelize');

class VehiculeService {
  async createVehicule(data) {
    return await Vehicule.create(data);
  }

  async getVehicules(filters = {}) {
    const where = {};
    if (filters.statut) where.statut = filters.statut;
    if (filters.type_vehicule) where.type_vehicule = filters.type_vehicule;
    if (filters.idAgent) where.id_agent = filters.idAgent;

    return await Vehicule.findAll({
      where,
      order: [['immatriculation', 'ASC']],
    });
  }

  async getVehiculeById(id) {
    return await Vehicule.findByPk(id);
  }

  async getVehiculesByAgent(idAgent) {
    return await Vehicule.findAll({
      where: { id_agent: idAgent },
      order: [['immatriculation', 'ASC']],
    });
  }

  async updateVehicule(id, data) {
    const vehicule = await Vehicule.findByPk(id);
    if (!vehicule) return null;
    return await vehicule.update(data);
  }

  async deleteVehicule(id) {
    const vehicule = await Vehicule.findByPk(id);
    if (!vehicule) return null;
    await vehicule.destroy();
    return true;
  }

  async getVehiculesMaintenanceDue() {
    const inOneMonth = new Date();
    inOneMonth.setMonth(inOneMonth.getMonth() + 1);

    return await Vehicule.findAll({
      where: {
        statut: 'ACTIF',
        date_prochain_controle: { [Op.lte]: inOneMonth },
      },
      order: [['date_prochain_controle', 'ASC']],
    });
  }

  async recordMaintenance(id, notes = '') {
    const vehicule = await Vehicule.findByPk(id);
    if (!vehicule) return null;

    const nextControl = new Date();
    nextControl.setFullYear(nextControl.getFullYear() + 1);

    return await vehicule.update({
      statut: 'ACTIF',
      date_derniere_maintenance: new Date(),
      date_prochain_controle: nextControl,
      notes,
    });
  }
}

module.exports = new VehiculeService();
