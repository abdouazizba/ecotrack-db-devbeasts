const { VehiculeService } = require('../services');
const { validationResult } = require('express-validator');

class VehiculeController {
  async createVehicule(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const vehicule = await VehiculeService.createVehicule(req.body);
      return res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicule,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error creating vehicle',
        error: error.message,
      });
    }
  }

  async getVehicules(req, res) {
    try {
      const filters = {
        statut: req.query.statut,
        type_vehicule: req.query.type_vehicule,
        idAgent: req.query.idAgent,
      };

      const vehicules = await VehiculeService.getVehicules(filters);
      return res.status(200).json({
        success: true,
        data: vehicules,
        count: vehicules.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving vehicles',
        error: error.message,
      });
    }
  }

  async getVehiculeById(req, res) {
    try {
      const vehicule = await VehiculeService.getVehiculeById(req.params.id);
      if (!vehicule) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
      return res.status(200).json({ success: true, data: vehicule });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving vehicle',
        error: error.message,
      });
    }
  }

  async getVehiculesByAgent(req, res) {
    try {
      const vehicules = await VehiculeService.getVehiculesByAgent(req.params.agentId);
      return res.status(200).json({
        success: true,
        data: vehicules,
        count: vehicules.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving agent vehicles',
        error: error.message,
      });
    }
  }

  async updateVehicule(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const vehicule = await VehiculeService.updateVehicule(req.params.id, req.body);
      if (!vehicule) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicule,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error updating vehicle',
        error: error.message,
      });
    }
  }

  async deleteVehicule(req, res) {
    try {
      const result = await VehiculeService.deleteVehicule(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
      return res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting vehicle',
        error: error.message,
      });
    }
  }

  async getVehiculesMaintenanceDue(req, res) {
    try {
      const vehicules = await VehiculeService.getVehiculesMaintenanceDue();
      return res.status(200).json({
        success: true,
        data: vehicules,
        count: vehicules.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving vehicles due for maintenance',
        error: error.message,
      });
    }
  }

  async recordMaintenance(req, res) {
    try {
      const vehicule = await VehiculeService.recordMaintenance(
        req.params.id,
        req.body.notes || ''
      );
      if (!vehicule) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Maintenance recorded',
        data: vehicule,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error recording maintenance',
        error: error.message,
      });
    }
  }
}

module.exports = new VehiculeController();
