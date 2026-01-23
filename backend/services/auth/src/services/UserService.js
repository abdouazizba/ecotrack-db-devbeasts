const { Utilisateur, Agent, Citoyen, Admin } = require('../models');

class UserService {
  // Get the user profile
  static async getUserProfile(userId) {
    const user = await Utilisateur.findByPk(userId);
    if (!user) return null;

    // Load specific data according to role
    let specificData = {};
    if (user.role === 'agent') {
      const agent = await Agent.findByPk(userId);
      specificData = agent ? agent.dataValues : {};
    } else if (user.role === 'citoyen') {
      const citoyen = await Citoyen.findByPk(userId);
      specificData = citoyen ? citoyen.dataValues : {};
    } else if (user.role === 'admin') {
      const admin = await Admin.findByPk(userId);
      specificData = admin ? admin.dataValues : {};
    }

    return this.sanitizeUser({ ...user.dataValues, ...specificData });
  }

  // Update the user profile
  static async updateUserProfile(userId, updateData) {
    const user = await Utilisateur.findByPk(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Update common data
    const { nom, prenom, date_naissance } = updateData;
    await user.update({ nom, prenom, date_naissance });

    // Update specific data according to role
    if (user.role === 'agent') {
      const agent = await Agent.findByPk(userId);
      if (agent && updateData.numero_badge !== undefined) {
        await agent.update({ numero_badge: updateData.numero_badge });
      }
    } else if (user.role === 'citoyen') {
      const citoyen = await Citoyen.findByPk(userId);
      if (citoyen) {
        const updates = {};
        if (updateData.telephone !== undefined) updates.telephone = updateData.telephone;
        if (updateData.email_verified !== undefined) updates.email_verified = updateData.email_verified;
        if (Object.keys(updates).length > 0) {
          await citoyen.update(updates);
        }
      }
    } else if (user.role === 'admin') {
      const admin = await Admin.findByPk(userId);
      if (admin) {
        const updates = {};
        if (updateData.niveau_acces !== undefined) updates.niveau_acces = updateData.niveau_acces;
        if (updateData.permissions !== undefined) updates.permissions = updateData.permissions;
        if (Object.keys(updates).length > 0) {
          await admin.update(updates);
        }
      }
    }

    return this.getUserProfile(userId);
  }

  // Disable an account
  static async deactivateAccount(userId) {
    const user = await Utilisateur.findByPk(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    await user.update({ is_active: false });
    return { message: 'Compte désactivé avec succès' };
  }

  // Clean user data
  static sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = UserService;
