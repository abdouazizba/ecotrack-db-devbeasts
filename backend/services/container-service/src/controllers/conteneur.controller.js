const { validationResult } = require('express-validator');
const { ConteneurService } = require('../services');

class ConteneurController {
  static async createConteneur(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const conteneur = await ConteneurService.createConteneur(req.body);
      return res.status(201).json({
        message: 'Container created successfully',
        conteneur,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAllConteneurs(req, res) {
    try {
      const { statut, type_conteneur, id_zone } = req.query;
      const filters = {};
      if (statut) filters.statut = statut;
      if (type_conteneur) filters.type_conteneur = type_conteneur;
      if (id_zone) filters.id_zone = id_zone;

      const conteneurs = await ConteneurService.getAllConteneurs(filters);
      return res.status(200).json({
        message: 'Containers retrieved',
        conteneurs,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getConteneurById(req, res) {
    try {
      const conteneur = await ConteneurService.getConteneurById(req.params.conteneurId);
      if (!conteneur) {
        return res.status(404).json({ error: 'Container not found' });
      }

      return res.status(200).json({
        message: 'Container retrieved',
        conteneur,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateConteneur(req, res) {
    try {
      const conteneur = await ConteneurService.updateConteneur(req.params.conteneurId, req.body);
      return res.status(200).json({
        message: 'Container updated',
        conteneur,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteConteneur(req, res) {
    try {
      const result = await ConteneurService.deleteConteneur(req.params.conteneurId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getConteneursneedingService(req, res) {
    try {
      const { fillRateThreshold = 80 } = req.query;
      const conteneurs = await ConteneurService.getConteneursneedingService(fillRateThreshold);
      return res.status(200).json({
        message: 'Containers needing service',
        conteneurs,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ConteneurController;
