const AgentService = require('../services/AgentService');

class AgentController {
  static async getAgentZone(req, res) {
    try {
      const { id } = req.params;
      const token = req.headers.authorization?.split(' ')[1];
      const data = await AgentService.getAgentZone(id, token);
      return res.status(200).json({ message: 'Agent zone retrieved', ...data });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAgentZoneContainers(req, res) {
    try {
      const { id } = req.params;
      const token = req.headers.authorization?.split(' ')[1];
      const { statut, type_conteneur, limit, page } = req.query;
      const filters = {};
      if (statut) filters.statut = statut;
      if (type_conteneur) filters.type_conteneur = type_conteneur;
      if (limit) filters.limit = limit;
      if (page) filters.page = page;

      const data = await AgentService.getAgentZoneContainers(id, token, filters);
      return res.status(200).json({ message: 'Agent zone containers retrieved', ...data });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('no assigned zone')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AgentController;
