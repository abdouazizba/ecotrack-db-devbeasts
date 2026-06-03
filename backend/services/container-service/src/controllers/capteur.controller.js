const { Capteur, Conteneur, Mesure } = require('../models');
const { body, param, validationResult } = require('express-validator');

class CapteurController {
  // POST /api/capteurs — create a new capteur
  static async createCapteur(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { code_capteur, type, id_conteneur, statut, batterie } = req.body;

      const conteneur = await Conteneur.findByPk(id_conteneur);
      if (!conteneur) return res.status(404).json({ error: 'Container not found' });

      const capteur = await Capteur.create({ code_capteur, type, id_conteneur, statut, batterie });
      return res.status(201).json({ message: 'Capteur created', capteur });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'code_capteur already exists' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/capteurs — all capteurs (optionally filtered by ?id_conteneur=)
  static async getAllCapteurs(req, res) {
    try {
      const where = {};
      if (req.query.id_conteneur) where.id_conteneur = req.query.id_conteneur;

      const capteurs = await Capteur.findAll({
        where,
        include: [{ model: Conteneur, as: 'conteneur', attributes: ['id', 'code_conteneur', 'type_conteneur'] }],
        order: [['created_at', 'ASC']],
      });

      // Fetch latest measurement per container in one query
      const conteneurIds = [...new Set(capteurs.map(c => c.id_conteneur))];
      let latestMesuresMap = new Map();

      if (conteneurIds.length > 0) {
        const { Op, fn, col, literal } = require('sequelize');
        // Get the latest mesure for each conteneur
        const latestMesures = await Mesure.findAll({
          where: { id_conteneur: conteneurIds },
          attributes: ['id_conteneur', 'taux_remplissage', 'temperature', 'signal_force', 'date_mesure'],
          order: [['date_mesure', 'DESC']],
          // Deduplicate: keep only the latest per conteneur
          raw: true,
        });
        // Keep only the first (latest) mesure per conteneur
        for (const m of latestMesures) {
          if (!latestMesuresMap.has(m.id_conteneur)) {
            latestMesuresMap.set(m.id_conteneur, m);
          }
        }
      }

      const enrichedCapteurs = capteurs.map(c => {
        const m = latestMesuresMap.get(c.id_conteneur) || null;
        let valeur_actuelle = null;
        if (m) {
          if (c.type === 'REMPLISSAGE') valeur_actuelle = m.taux_remplissage;
          else if (c.type === 'TEMPERATURE') valeur_actuelle = m.temperature;
          else if (c.type === 'SIGNAL') valeur_actuelle = m.signal_force;
        }
        return { ...c.toJSON(), valeur_actuelle, derniere_mesure_at: c.derniere_mesure_at };
      });

      return res.status(200).json({ message: 'Capteurs retrieved', count: enrichedCapteurs.length, capteurs: enrichedCapteurs });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/capteurs/:id
  static async getCapteurById(req, res) {
    try {
      const capteur = await Capteur.findByPk(req.params.id, {
        include: [{ model: Conteneur, as: 'conteneur' }],
      });
      if (!capteur) return res.status(404).json({ error: 'Capteur not found' });

      // Include the latest measurement from the associated container
      const derniereMesure = await Mesure.findOne({
        where: { id_conteneur: capteur.id_conteneur },
        order: [['date_mesure', 'DESC']],
        attributes: ['taux_remplissage', 'temperature', 'signal_force', 'batterie', 'date_mesure'],
      });

      // Extract the relevant value based on sensor type
      let valeur_actuelle = null;
      if (derniereMesure) {
        if (capteur.type === 'REMPLISSAGE') valeur_actuelle = derniereMesure.taux_remplissage;
        else if (capteur.type === 'TEMPERATURE') valeur_actuelle = derniereMesure.temperature;
        else if (capteur.type === 'SIGNAL') valeur_actuelle = derniereMesure.signal_force;
      }

      return res.status(200).json({
        capteur: {
          ...capteur.toJSON(),
          derniere_mesure: derniereMesure || null,
          valeur_actuelle,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/capteurs/conteneur/:conteneurId — all sensors of a given container
  static async getCapteursByConteneur(req, res) {
    try {
      const capteurs = await Capteur.findAll({
        where: { id_conteneur: req.params.conteneurId },
        order: [['type', 'ASC']],
      });
      return res.status(200).json({ capteurs });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT /api/capteurs/:id — full update
  static async updateCapteur(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const capteur = await Capteur.findByPk(req.params.id);
      if (!capteur) return res.status(404).json({ error: 'Capteur not found' });

      const { code_capteur, type, statut, batterie } = req.body;
      await capteur.update({ code_capteur, type, statut, batterie });
      return res.status(200).json({ message: 'Capteur updated', capteur });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'code_capteur already exists' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE /api/capteurs/:id
  static async deleteCapteur(req, res) {
    try {
      const capteur = await Capteur.findByPk(req.params.id);
      if (!capteur) return res.status(404).json({ error: 'Capteur not found' });

      await capteur.destroy();
      return res.status(200).json({ message: 'Capteur deleted' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PATCH /api/capteurs/:id/conteneur — assign capteur to a (different) container
  static async assignToConteneur(req, res) {
    try {
      const { id_conteneur } = req.body;
      if (!id_conteneur) return res.status(400).json({ error: 'id_conteneur is required' });

      const conteneur = await Conteneur.findByPk(id_conteneur);
      if (!conteneur) return res.status(404).json({ error: 'Container not found' });

      const capteur = await Capteur.findByPk(req.params.id);
      if (!capteur) return res.status(404).json({ error: 'Capteur not found' });

      await capteur.update({ id_conteneur });
      return res.status(200).json({
        message: `Capteur ${capteur.code_capteur} assigned to container ${conteneur.code_conteneur}`,
        capteur,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PATCH /api/capteurs/:id/batterie — update battery level (called by IoT simulator)
  static async updateBatterie(req, res) {
    try {
      const { batterie } = req.body;
      if (batterie === undefined || batterie < 0 || batterie > 100) {
        return res.status(400).json({ error: 'batterie must be 0–100' });
      }

      const [updated] = await Capteur.update(
        { batterie, derniere_mesure_at: new Date() },
        { where: { id: req.params.id } }
      );

      if (!updated) return res.status(404).json({ error: 'Capteur not found' });
      return res.status(200).json({ message: 'Battery updated' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CapteurController;
