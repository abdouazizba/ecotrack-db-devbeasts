const { TourneeService, CollecteurService } = require('../services');
const { validationResult } = require('express-validator');

class TourneeController {
  async createTournee(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const tournee = await TourneeService.createTournee(req.body);
      return res.status(201).json({
        success: true,
        message: 'Tour created successfully',
        data: tournee,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error creating tour',
        error: error.message,
      });
    }
  }

  async getTournees(req, res) {
    try {
      const filters = {
        statut: req.query.statut,
        date: req.query.date,
      };

      const tournees = await TourneeService.getTournees(filters);
      return res.status(200).json({
        success: true,
        data: tournees,
        count: tournees.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving tours',
        error: error.message,
      });
    }
  }

  async getTourneeById(req, res) {
    try {
      const tournee = await TourneeService.getTourneeById(req.params.id);
      if (!tournee) {
        return res.status(404).json({
          success: false,
          message: 'Tour not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: tournee,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving tour',
        error: error.message,
      });
    }
  }

  async updateTournee(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const tournee = await TourneeService.updateTournee(req.params.id, req.body);
      if (!tournee) {
        return res.status(404).json({
          success: false,
          message: 'Tour not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tour updated successfully',
        data: tournee,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error updating tour',
        error: error.message,
      });
    }
  }

  async deleteTournee(req, res) {
    try {
      const result = await TourneeService.deleteTournee(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Tour not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tour deleted successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting tour',
        error: error.message,
      });
    }
  }

  async getTourneesByAgent(req, res) {
    try {
      const filters = { statut: req.query.statut };
      const tournees = await TourneeService.getTourneesByAgent(req.params.agentId, filters);

      return res.status(200).json({
        success: true,
        data: tournees,
        count: tournees.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving agent tours',
        error: error.message,
      });
    }
  }

  async addAgentToTournee(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const assignment = await TourneeService.addAgentToTournee(
        req.params.id,
        req.body.idAgent,
        req.body.role
      );

      return res.status(201).json({
        success: true,
        message: 'Agent added to tour',
        data: assignment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error adding agent',
        error: error.message,
      });
    }
  }

  async removeAgentFromTournee(req, res) {
    try {
      const result = await TourneeService.removeAgentFromTournee(
        req.params.id,
        req.params.agentId
      );

      return res.status(200).json({
        success: true,
        message: 'Agent removed from tour',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error removing agent',
        error: error.message,
      });
    }
  }

  async getTourneeStats(req, res) {
    try {
      const stats = await TourneeService.getTourneeStats(req.params.id);
      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Tour not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving statistics',
        error: error.message,
      });
    }
  }
}

module.exports = new TourneeController();
