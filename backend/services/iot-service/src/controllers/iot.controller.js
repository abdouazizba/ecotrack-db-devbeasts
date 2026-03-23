const { v4: uuidv4 } = require('uuid');
const containerServiceClient = require('../services/ContainerServiceClient');
const EventService = require('../services/EventService');

/**
 * POST /api/iot/measure
 * Receive measurement from IoT device and forward to container-service
 */
exports.recordMeasurement = async (req, res) => {
  try {
    const {
      capteur_id,
      conteneur_id,
      type_capteur,
      valeur,
      unite,
      timestamp_capteur,
      qualite_signal,
      batterie
    } = req.body;

    // Create enriched measurement data
    const measurementData = {
      capteur_id,
      type_capteur,
      valeur,
      unite,
      timestamp_capteur: timestamp_capteur || new Date().toISOString(),
      timestamp_reception: new Date().toISOString(),
      qualite_signal: qualite_signal || 100,
      batterie: batterie || 100,
      message_id: uuidv4()
    };

    console.log(`📊 Received measurement from ${capteur_id} for container ${conteneur_id}`);

    // Forward to container-service
    const result = await containerServiceClient.recordMeasurement(
      conteneur_id,
      measurementData
    );

    if (result.success) {
      // Publish success event
      await EventService.publishEvent('measurement.recorded', {
        message_id: measurementData.message_id,
        capteur_id,
        conteneur_id,
        type_capteur,
        valeur,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        status: 'success',
        message: 'Measurement recorded',
        message_id: measurementData.message_id,
        forwarded_to: 'container-service',
        container_id: conteneur_id,
        measurement: {
          type: type_capteur,
          value: valeur,
          unit: unite
        },
        container_response: result.data
      });
    } else {
      // Publish failure event
      await EventService.publishEvent('measurement.failed', {
        message_id: measurementData.message_id,
        capteur_id,
        conteneur_id,
        error: result.error,
        reason: 'Container service forwarding failed'
      });

      // Forward failed, but we got the data
      return res.status(202).json({
        status: 'accepted',
        message: 'Measurement accepted but forwarding failed',
        message_id: measurementData.message_id,
        error: result.error,
        note: 'Measurement will be processed asynchronously',
        measurement: {
          type: type_capteur,
          value: valeur,
          unit: unite
        }
      });
    }
  } catch (error) {
    console.error('Error recording measurement:', error);
    return res.status(500).json({
      error: 'Failed to process measurement',
      message: error.message
    });
  }
};

/**
 * POST /api/iot/device/register
 * Register a new IoT device
 */
exports.registerDevice = async (req, res) => {
  try {
    const { capteur_id, type_capteur, conteneur_id, api_key } = req.body;

    // Verify API key
    if (api_key !== process.env.DEVICE_API_KEY) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }

    // Check if container exists
    const containerCheck = await containerServiceClient.containerExists(conteneur_id);
    
    if (!containerCheck.exists) {
      return res.status(400).json({
        error: 'Invalid container',
        message: `Container ${conteneur_id} does not exist`
      });
    }

    const deviceData = {
      capteur_id,
      type_capteur,
      conteneur_id,
      registered_at: new Date().toISOString(),
      device_id: uuidv4()
    };

    console.log(`✓ Device registered: ${capteur_id} (${type_capteur})`);

    return res.status(201).json({
      status: 'success',
      message: 'Device registered',
      device_id: deviceData.device_id,
      device: {
        capteur_id,
        type_capteur,
        container_id: conteneur_id
      }
    });
  } catch (error) {
    console.error('Error registering device:', error);
    return res.status(500).json({
      error: 'Failed to register device',
      message: error.message
    });
  }
};

/**
 * GET /api/iot/device/:capteur_id
 * Get device information
 */
exports.getDevice = async (req, res) => {
  try {
    const { capteur_id } = req.params;

    // In real app, would query database
    // For now, return mock data
    return res.status(200).json({
      capteur_id,
      type_capteur: 'REMPLISSAGE',
      conteneur_id: 1,
      last_measurement: {
        timestamp: new Date().toISOString(),
        value: 0,
        unit: '%'
      },
      status: 'ACTIVE',
      battery: 95,
      signal_quality: 85
    });
  } catch (error) {
    console.error('Error fetching device:', error);
    return res.status(500).json({
      error: 'Failed to fetch device',
      message: error.message
    });
  }
};

/**
 * GET /api/iot/status
 * Get IoT service status
 */
exports.getStatus = async (req, res) => {
  try {
    return res.status(200).json({
      service: 'iot-service',
      status: 'RUNNING',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: [
        'POST /api/iot/measure',
        'POST /api/iot/device/register',
        'GET /api/iot/device/:capteur_id',
        'GET /api/iot/status',
        'GET /health'
      ]
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
};
