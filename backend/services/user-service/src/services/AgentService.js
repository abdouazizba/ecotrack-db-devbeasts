const axios = require('axios');
const { Agent } = require('../models');

const CONTAINER_SERVICE_URL = process.env.CONTAINER_SERVICE_URL || 'http://container-service:3002';

class AgentService {
  static async getAgentById(agentId) {
    const agent = await Agent.findByPk(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    return agent;
  }

  static async getAgentZone(agentId, authToken) {
    const agent = await this.getAgentById(agentId);
    if (!agent.id_zone) return { zone: null, id_zone: null };

    const response = await axios.get(
      `${CONTAINER_SERVICE_URL}/api/zones/${agent.id_zone}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return { zone: response.data.zone, id_zone: agent.id_zone };
  }

  static async getAgentZoneContainers(agentId, authToken, filters = {}) {
    const agent = await this.getAgentById(agentId);
    if (!agent.id_zone) throw new Error('Agent has no assigned zone');

    const params = { id_zone: agent.id_zone, ...filters };
    const response = await axios.get(
      `${CONTAINER_SERVICE_URL}/api/conteneurs`,
      { headers: { Authorization: `Bearer ${authToken}` }, params }
    );
    return response.data;
  }
}

module.exports = AgentService;
