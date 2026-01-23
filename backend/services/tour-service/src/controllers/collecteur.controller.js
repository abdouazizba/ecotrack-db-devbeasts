const { CollecteurService } = require('../services');
const { validationResult } = require('express-validator');

class CollecteurController {
  async createCollecteur(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const collecteur = await CollecteurService.createCollecteur(req.body);
      return res.status(201).json({
        success: true,
        message: 'Collector created successfully',
        data: collecteur,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error creating collector',
        error: error.message,
      });
    }
  }

  async getCollecteurs(req, res) {
    try {
      const filters = {
        statut: req.query.statut,
        idAgent: req.query.idAgent,
      };

      const collecteurs = await CollecteurService.getCollecteurs(filters);
      return res.status(200).json({
        success: true,
        data: collecteurs,
        count: collecteurs.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving collectors',
        error: error.message,
      });
    }
  }

  async getCollecteurById(req, res) {
    try {
      const collecteur = await CollecteurService.getCollecteurById(req.params.id);
      if (!collecteur) {
        return res.status(404).json({
          success: false,
          message: 'Collector not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: collecteur,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving collector',
        error: error.message,
      });
    }
  }

  async getCollecteursByAgent(req, res) {
    try {
      const collecteurs = await CollecteurService.getCollecteursByAgent(req.params.agentId);
      return res.status(200).json({
        success: true,
        data: collecteurs,
        count: collecteurs.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving agent collectors',
        error: error.message,
      });
    }
  }

  async updateCollecteur(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const collecteur = await CollecteurService.updateCollecteur(req.params.id, req.body);
      if (!collecteur) {
        return res.status(404).json({
          success: false,
          message: 'Collector not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Collector updated successfully',
        data: collecteur,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error updating collector',
        error: error.message,
      });
    }
  }

  async deleteCollecteur(req, res) {
    try {
      const result = await CollecteurService.deleteCollecteur(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Collector not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Collector deleted successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting collector',
        error: error.message,
      });
    }
  }

  async getCollecteursByLowBattery(req, res) {
    try {
      const threshold = req.query.threshold || 20;
      const collecteurs = await CollecteurService.getCollecteursPlusBatterie(threshold);

      return res.status(200).json({
        success: true,
        data: collecteurs,
        count: collecteurs.length,
        message: `Collecteurs avec batterie <= ${threshold}%`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving low battery collectors',
        error: error.message,
      });
    }
  }

  async recordMaintenance(req, res) {
    try {
      const collecteur = await CollecteurService.recordMaintenance(
        req.params.id,
        req.body.notes || ''
      );

      if (!collecteur) {
        return res.status(404).json({
          success: false,
          message: 'Collector not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Maintenance recorded',
        data: collecteur,
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

module.exports = new CollecteurController();
