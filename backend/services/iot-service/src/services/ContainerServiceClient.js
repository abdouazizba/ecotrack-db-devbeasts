const axios = require('axios');

class ContainerServiceClient {
  constructor() {
    this.baseURL = process.env.CONTAINER_SERVICE_URL || 'http://container-service:3002';
    this.timeout = 5000;
  }

  /**
   * Forward measurement to container-service
   * @param {number} containerId - Container ID
   * @param {object} measurementData - Measurement data
   * @returns {Promise<object>}
   */
  async recordMeasurement(containerId, measurementData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/container/${containerId}/measure`,
        measurementData,
        { timeout: this.timeout }
      );
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      console.error(`Error forwarding to container-service: ${error.message}`);
      return {
        success: false,
        error: error.message,
        statusCode: error.response?.status || 500
      };
    }
  }

  /**
   * Register IoT device (optional)
   */
  async registerDevice(deviceData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/container/device/register`,
        deviceData,
        { timeout: this.timeout }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error registering device: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if container exists
   */
  async containerExists(containerId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/container/${containerId}`,
        { timeout: this.timeout }
      );
      return { exists: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      console.error(`Error checking container: ${error.message}`);
      return { exists: null, error: error.message };
    }
  }
}

module.exports = new ContainerServiceClient();
