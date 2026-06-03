const axios = require('axios');

class ContainerServiceClient {
  constructor() {
    this.baseURL = process.env.CONTAINER_SERVICE_URL || 'http://container-service:3002';
    this.timeout = 8000;
  }

  // Fetch all containers (returns array)
  async getContainers() {
    try {
      const response = await axios.get(`${this.baseURL}/api/conteneurs`, { timeout: this.timeout });
      let data = response.data?.conteneurs || response.data?.data || response.data;
      if (data && !Array.isArray(data) && data.conteneurs) data = data.conteneurs;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('ContainerServiceClient.getContainers:', error.message);
      return [];
    }
  }

  // Fetch all capteurs grouped by container
  // Returns Map<containerId, Array<{ id, type, code_capteur, statut }>>
  async getCapteurs() {
    try {
      const response = await axios.get(`${this.baseURL}/api/capteurs`, { timeout: this.timeout });
      const capteurs = response.data?.capteurs || response.data?.data || response.data;

      const map = new Map();
      if (!Array.isArray(capteurs)) return map;

      for (const c of capteurs) {
        if (!map.has(c.id_conteneur)) map.set(c.id_conteneur, []);
        map.get(c.id_conteneur).push({ id: c.id, type: c.type, code_capteur: c.code_capteur, statut: c.statut });
      }

      return map;
    } catch (error) {
      console.error('ContainerServiceClient.getCapteurs:', error.message);
      return new Map();
    }
  }

  // Forward a measurement to container-service
  // measurementData: { taux_remplissage, temperature?, batterie?, signal_force?, id_capteur? }
  async recordMeasurement(containerId, measurementData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/mesures`,
        { ...measurementData, id_conteneur: containerId },
        { timeout: this.timeout }
      );
      return { success: true, data: response.data, statusCode: response.status };
    } catch (error) {
      console.error(`ContainerServiceClient.recordMeasurement [${containerId}]:`, error.message);
      return { success: false, error: error.message, statusCode: error.response?.status || 500 };
    }
  }

  // Check if a container exists
  async containerExists(containerId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/conteneurs/${containerId}`, { timeout: this.timeout });
      return { exists: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) return { exists: false };
      console.error('ContainerServiceClient.containerExists:', error.message);
      return { exists: null, error: error.message };
    }
  }
}

module.exports = new ContainerServiceClient();
