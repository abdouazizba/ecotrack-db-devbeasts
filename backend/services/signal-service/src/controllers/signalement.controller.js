const { SignalementService } = require('../services');
const { validationResult } = require('express-validator');

class SignalementController {
  async createSignalement(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const signalement = await SignalementService.createSignalement(req.body);
      return res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: signalement,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error creating report',
        error: error.message,
      });
    }
  }

  async getSignalements(req, res) {
    try {
      const filters = {
        type: req.query.type,
        statut: req.query.statut,
        priorite: req.query.priorite,
        idConteneur: req.query.idConteneur,
        idUtilisateur: req.query.idUtilisateur,
      };

      const signalements = await SignalementService.getSignalements(filters);
      return res.status(200).json({
        success: true,
        data: signalements,
        count: signalements.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving reports',
        error: error.message,
      });
    }
  }

  async getSignalementById(req, res) {
    try {
      const signalement = await SignalementService.getSignalementById(req.params.id);
      if (!signalement) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: signalement,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving report',
        error: error.message,
      });
    }
  }

  async updateSignalement(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const signalement = await SignalementService.updateSignalement(req.params.id, req.body);
      if (!signalement) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Report updated successfully',
        data: signalement,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error updating report',
        error: error.message,
      });
    }
  }

  async deleteSignalement(req, res) {
    try {
      const result = await SignalementService.deleteSignalement(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting report',
        error: error.message,
      });
    }
  }

  async getSignalementsByCitoyen(req, res) {
    try {
      const filters = { statut: req.query.statut };
      const signalements = await SignalementService.getSignalementsByCitoyen(
        req.params.citoyenId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: signalements,
        count: signalements.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving citizen reports',
        error: error.message,
      });
    }
  }

  async getSignalementsByContainer(req, res) {
    try {
      const signalements = await SignalementService.getSignalementsByContainer(
        req.params.containerId
      );

      return res.status(200).json({
        success: true,
        data: signalements,
        count: signalements.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving container reports',
        error: error.message,
      });
    }
  }

  async getOpenSignalements(req, res) {
    try {
      const signalements = await SignalementService.getOpenSignalements();
      return res.status(200).json({
        success: true,
        data: signalements,
        count: signalements.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving open reports',
        error: error.message,
      });
    }
  }

  async closeSignalement(req, res) {
    try {
      const signalement = await SignalementService.closeSignalement(
        req.params.id,
        req.body.notes || ''
      );

      if (!signalement) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Report closed successfully',
        data: signalement,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error closing report',
        error: error.message,
      });
    }
  }

  async markInProgress(req, res) {
    try {
      const signalement = await SignalementService.markInProgress(req.params.id);

      if (!signalement) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Report marked in progress',
        data: signalement,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error marking report in progress',
        error: error.message,
      });
    }
  }

  async rejectSignalement(req, res) {
    try {
      const signalement = await SignalementService.rejectSignalement(
        req.params.id,
        req.body.notes || ''
      );

      if (!signalement) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Report rejected',
        data: signalement,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error rejecting report',
        error: error.message,
      });
    }
  }
}

module.exports = new SignalementController();
