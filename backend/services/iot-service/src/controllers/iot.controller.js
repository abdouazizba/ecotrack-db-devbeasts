const { v4: uuidv4 } = require('uuid');
const containerServiceClient = require('../services/ContainerServiceClient');
const EventService = require('../services/EventService');

/**
 * POST /api/iot/measure
 * Receive sensor measurement and forward to container-service
 *
 * Body: { id_conteneur, capteur_id?, taux_remplissage, temperature?, batterie?, signal_force? }
 */
exports.recordMeasurement = async (req, res) => {
  try {
    const {
      id_conteneur,
      capteur_id,
      taux_remplissage,
      temperature,
      batterie,
      signal_force,
    } = req.body;

    const message_id = uuidv4();
    const timestamp_reception = new Date().toISOString();

    console.log(`📊 Measurement received | capteur=${capteur_id || 'anonymous'} | conteneur=${id_conteneur} | fill=${taux_remplissage}%`);

    const measurementData = {
      taux_remplissage,
      ...(temperature  !== undefined && { temperature }),
      ...(batterie     !== undefined && { batterie }),
      ...(signal_force !== undefined && { signal_force }),
    };

    const result = await containerServiceClient.recordMeasurement(id_conteneur, measurementData);

    if (result.success) {
      await EventService.publishEvent('measurement.recorded', {
        message_id,
        capteur_id: capteur_id || null,
        id_conteneur,
        taux_remplissage,
        timestamp: timestamp_reception,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Measurement recorded',
        message_id,
        id_conteneur,
        taux_remplissage,
        mesure: result.data?.mesure || null,
      });
    }

    // Container-service unreachable — event for async retry
    await EventService.publishEvent('measurement.failed', {
      message_id,
      capteur_id: capteur_id || null,
      id_conteneur,
      error: result.error,
    });

    return res.status(202).json({
      status: 'accepted',
      message: 'Measurement accepted but forwarding failed — will retry',
      message_id,
      error: result.error,
    });
  } catch (error) {
    console.error('Error recording measurement:', error);
    return res.status(500).json({
      error: 'Failed to process measurement',
      message: error.message,
    });
  }
};

/**
 * POST /api/iot/device/register
 * Register a new IoT device/sensor
 *
 * Body: { capteur_id, id_conteneur, api_key }
 */
exports.registerDevice = async (req, res) => {
  try {
    const { capteur_id, id_conteneur, api_key } = req.body;

    if (api_key !== process.env.DEVICE_API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const containerCheck = await containerServiceClient.containerExists(id_conteneur);
    if (!containerCheck.exists) {
      return res.status(404).json({
        error: 'Container not found',
        id_conteneur,
      });
    }

    const device_id = uuidv4();
    console.log(`✓ Device registered: ${capteur_id} → conteneur ${id_conteneur}`);

    return res.status(201).json({
      status: 'success',
      message: 'Device registered',
      device_id,
      capteur_id,
      id_conteneur,
    });
  } catch (error) {
    console.error('Error registering device:', error);
    return res.status(500).json({
      error: 'Failed to register device',
      message: error.message,
    });
  }
};

/**
 * GET /api/iot/status
 */
exports.getStatus = async (req, res) => {
  return res.status(200).json({
    service: 'iot-service',
    status: 'RUNNING',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'POST /api/iot/measure',
      'POST /api/iot/device/register',
      'GET /api/iot/simulator/stats',
      'GET /api/iot/status',
      'GET /health',
    ],
  });
};
