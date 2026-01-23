const { Collecteur } = require('../models');
const { Op } = require('sequelize');

class CollecteurService {
  async createCollecteur(collecteurData) {
    return await Collecteur.create(collecteurData);
  }

  async getCollecteurs(filters = {}) {
    const where = {};
    if (filters.statut) where.statut = filters.statut;
    if (filters.idAgent) where.id_agent = filters.idAgent;

    return await Collecteur.findAll({
      where,
      order: [['code_collecteur', 'ASC']],
    });
  }

  async getCollecteurById(id) {
    return await Collecteur.findByPk(id);
  }

  async getCollecteursByAgent(idAgent) {
    return await Collecteur.findAll({
      where: { id_agent: idAgent },
      order: [['code_collecteur', 'ASC']],
    });
  }

  async updateCollecteur(id, collecteurData) {
    const collecteur = await Collecteur.findByPk(id);
    if (!collecteur) return null;

    return await collecteur.update(collecteurData);
  }

  async deleteCollecteur(id) {
    const collecteur = await Collecteur.findByPk(id);
    if (!collecteur) return null;

    await collecteur.destroy();
    return true;
  }

  async getCollecteursPlusBatterie(batteryThreshold = 20) {
    return await Collecteur.findAll({
      where: {
        batterie_actuelle: { [Op.lte]: batteryThreshold },
        statut: 'ACTIF',
      },
    });
  }

  async getCollecteursByMaintenanceStatus(needsMaintenance = true) {
    if (needsMaintenance) {
      return await Collecteur.findAll({
        where: {
          statut: 'EN_MAINTENANCE',
        },
      });
    }

    return await Collecteur.findAll({
      where: {
        statut: { [Op.ne]: 'EN_MAINTENANCE' },
      },
    });
  }

  async updateBatteryStatus(id, batteryPercentage) {
    const collecteur = await Collecteur.findByPk(id);
    if (!collecteur) return null;

    return await collecteur.update({ batterie_actuelle: batteryPercentage });
  }

  async recordMaintenance(id, notes = '') {
    const collecteur = await Collecteur.findByPk(id);
    if (!collecteur) return null;

    return await collecteur.update({
      statut: 'ACTIF',
      date_derniere_maintenance: new Date(),
      notes,
    });
  }
}

module.exports = new CollecteurService();
