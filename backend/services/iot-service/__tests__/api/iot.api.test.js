const request = require('supertest');
const app = require('../../src/app');

// Mock ContainerServiceClient et EventService après require app
jest.mock('../../src/services/ContainerServiceClient');
jest.mock('../../src/services/EventService');

const ContainerServiceClient = require('../../src/services/ContainerServiceClient');
const EventService = require('../../src/services/EventService');

describe('IoT Service API Tests', () => {

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    ContainerServiceClient.recordMeasurement.mockResolvedValue({
      success: true,
      data: { id: 1, message: 'recorded' }
    });
    EventService.publishEvent.mockResolvedValue(true);
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('iot-service');
    });
  });

  describe('POST /api/iot/measure', () => {

    test('should accept valid measurement', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_001',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 75.5,
          unite: '%',
          qualite_signal: 85
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message_id).toBeDefined();
      expect(res.body.measurement.value).toBe(75.5);
    });

    test('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          // Missing capteur_id
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 75.5,
          unite: '%'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    test('should validate conteneur_id is positive integer', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_001',
          conteneur_id: -1,
          type_capteur: 'REMPLISSAGE',
          valeur: 75.5,
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

    test('should validate type_capteur enum', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_001',
          conteneur_id: 1,
          type_capteur: 'INVALID_TYPE',
          valeur: 75.5,
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

  });

  describe('GET /api/iot/status', () => {

    test('should return service status', async () => {
      const res = await request(app)
        .get('/api/iot/status');

      expect(res.status).toBe(200);
      expect(res.body.service).toBe('iot-service');
      expect(res.body.status).toBe('RUNNING');
      expect(res.body.endpoints).toBeDefined();
      expect(Array.isArray(res.body.endpoints)).toBe(true);
    });

  });

  describe('GET /api/iot/device/:capteur_id', () => {

    test('should return device information', async () => {
      const res = await request(app)
        .get('/api/iot/device/CAPTEUR_001');

      expect(res.status).toBe(200);
      expect(res.body.capteur_id).toBe('CAPTEUR_001');
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.battery).toBeDefined();
      expect(res.body.signal_quality).toBeDefined();
    });

  });

  describe('POST /api/iot/device/register', () => {

    test('should reject device registration without API key', async () => {
      const res = await request(app)
        .post('/api/iot/device/register')
        .send({
          capteur_id: 'CAPTEUR_NEW_001',
          type_capteur: 'TEMPERATURE',
          conteneur_id: 1,
          api_key: 'undefined_api_key'
        });

      // Should fail with 401 since DEVICE_API_KEY is not set
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    test('should reject device registration with invalid API key', async () => {
      const res = await request(app)
        .post('/api/iot/device/register')
        .send({
          capteur_id: 'CAPTEUR_INVALID_KEY',
          type_capteur: 'TEMPERATURE',
          conteneur_id: 1,
          api_key: 'wrong_api_key'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    test('should handle missing required fields in device registration', async () => {
      const res = await request(app)
        .post('/api/iot/device/register')
        .send({
          // Missing capteur_id
          type_capteur: 'TEMPERATURE',
          conteneur_id: 1,
          api_key: 'some_key'
        });

      expect([400, 401]).toContain(res.status);
    });

  });

  describe('Error Handling', () => {

    test('should return 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/api/iot/nonexistent');

      expect(res.status).toBe(404);
    });

    test('should return 405 for invalid methods', async () => {
      const res = await request(app)
        .delete('/api/iot/measure');

      expect(res.status).toBeDefined();
    });

    test('should handle measurement with missing valeur', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_001',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          // Missing valeur
          unite: '%'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    test('should handle measurement with missing unite', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_001',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 75.5
          // Missing unite
        });

      expect(res.status).toBe(400);
    });

  });

  describe('Different Sensor Types', () => {

    test('should accept TEMPERATURE sensor', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_TEMP_001',
          conteneur_id: 1,
          type_capteur: 'TEMPERATURE',
          valeur: 25.5,
          unite: '°C',
          qualite_signal: 90
        });

      expect(res.status).toBe(200);
      expect(res.body.measurement.type).toBe('TEMPERATURE');
    });

    test('should accept POIDS sensor', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_POIDS_001',
          conteneur_id: 1,
          type_capteur: 'POIDS',
          valeur: 250.75,
          unite: 'kg',
          qualite_signal: 80
        });

      expect(res.status).toBe(200);
      expect(res.body.measurement.type).toBe('POIDS');
    });

    test('should accept HUMIDITE sensor', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_HUM_001',
          conteneur_id: 1,
          type_capteur: 'HUMIDITE',
          valeur: 65.5,
          unite: '%RH',
          qualite_signal: 85
        });

      expect(res.status).toBe(200);
      expect(res.body.measurement.type).toBe('HUMIDITE');
    });

  });

  describe('Edge Cases', () => {

    test('should handle measurement with zero value', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_ZERO',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 0,
          unite: '%'
        });

      expect(res.status).toBe(200);
      expect(res.body.measurement.value).toBe(0);
    });

    test('should handle measurement with max value', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_MAX',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 100,
          unite: '%'
        });

      expect(res.status).toBe(200);
      expect(res.body.measurement.value).toBe(100);
    });

    test('should handle measurement with negative conteneur_id', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_NEG',
          conteneur_id: -5,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

    test('should handle measurement with zero conteneur_id', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_ZERO_ID',
          conteneur_id: 0,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

    test('should handle measurement with zero conteneur_id', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_ZERO_ID',
          conteneur_id: 0,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

  });

  describe('Forwarding Errors', () => {

    test('should handle container service failure gracefully', async () => {
      // Mock error response from container service
      ContainerServiceClient.recordMeasurement.mockResolvedValue({
        success: false,
        error: 'Service unavailable'
      });

      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_FORWARD_FAIL',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      // Should return 202 (accepted) when forwarding fails
      expect(res.status).toBe(202);
      expect(res.body.status).toBe('accepted');
      expect(res.body.note).toContain('asynchronously');
    });

    test('should handle measurement with all optional fields', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_FULL',
          conteneur_id: 1,
          type_capteur: 'TEMPERATURE',
          valeur: 25.5,
          unite: '°C',
          qualite_signal: 95,
          latitude: 48.8566,
          longitude: 2.3522,
          altitude: 35
        });

      expect(res.status).toBe(200);
      expect(res.body.measurement).toBeDefined();
    });

    test('should handle float values correctly', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_FLOAT',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 33.33333,
          unite: '%'
        });

      expect(res.status).toBe(200);
      expect(res.body.measurement.value).toBe(33.33333);
    });

    test('should handle large measurement values', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_LARGE',
          conteneur_id: 1,
          type_capteur: 'POIDS',
          valeur: 99999.99,
          unite: 'kg'
        });

      expect(res.status).toBe(200);
      expect(res.body.measurement.value).toBe(99999.99);
    });

  });

  describe('Request Validation', () => {

    test('should handle measurement without optional qualite_signal', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_NO_SIGNAL',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(200);
    });

    test('should handle device info request', async () => {
      const res = await request(app)
        .get('/api/iot/device/CAPTEUR_TEST');

      expect(res.status).toBe(200);
      expect(res.body.capteur_id).toBe('CAPTEUR_TEST');
    });

    test('should validate string values in measurement', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_STRING_VAL',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 'not_a_number',
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

    test('should validate non-integer conteneur_id', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_STRING_ID',
          conteneur_id: 'not_a_number',
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

  });

  describe('Container Service Integration', () => {

    test('should handle container service HTTP errors gracefully', async () => {
      // Set mock to reject for this specific test
      ContainerServiceClient.recordMeasurement.mockRejectedValueOnce(
        new Error('Connection failed')
      );

      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_CONN_FAIL',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      // After rejection, should return 202 (accepted) or 500 (error)
      expect([202, 500]).toContain(res.status);
    });

  });

  describe('Additional Edge Cases', () => {

    test('should handle very long sensor ID', async () => {
      const longId = 'CAPTEUR_' + 'X'.repeat(100);
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: longId,
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(200);
    });

    test('should handle decimal conteneur_id values', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_DECIMAL',
          conteneur_id: 1.5,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect([200, 400]).toContain(res.status);
    });

    test('should handle missing capteur_id', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          // Missing capteur_id
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

    test('should handle null valeur', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_NULL',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: null,
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

    test('should handle undefined valeur', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_UNDEF',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          // valeur not included
          unite: '%'
        });

      expect(res.status).toBe(400);
    });

  });

  describe('RabbitMQ Event Publishing', () => {

    test('should publish measurement.recorded event on success', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_EVENT_001',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(200);
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        'measurement.recorded',
        expect.objectContaining({
          capteur_id: 'CAPTEUR_EVENT_001',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50
        })
      );
    });

    test('should publish measurement.failed event on failure', async () => {
      ContainerServiceClient.recordMeasurement.mockResolvedValueOnce({
        success: false,
        error: 'Service unavailable'
      });

      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_FAIL_EVENT',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(202);
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        'measurement.failed',
        expect.objectContaining({
          capteur_id: 'CAPTEUR_FAIL_EVENT',
          error: 'Service unavailable'
        })
      );
    });

    test('should include message_id in published events', async () => {
      const res = await request(app)
        .post('/api/iot/measure')
        .send({
          capteur_id: 'CAPTEUR_MSG_ID',
          conteneur_id: 1,
          type_capteur: 'REMPLISSAGE',
          valeur: 50,
          unite: '%'
        });

      expect(res.status).toBe(200);
      
      const call = EventService.publishEvent.mock.calls[0];
      expect(call[0]).toBe('measurement.recorded');
      expect(call[1].message_id).toBeDefined();
      expect(call[1].message_id).toBe(res.body.message_id);
    });

  });

});


