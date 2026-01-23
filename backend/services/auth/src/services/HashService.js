const bcrypt = require('bcryptjs');

class HashService {
  // Hash a password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare a password with its hash
  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Validate password strength
  static validatePasswordStrength(password) {
    if (password.length < 8) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)' };
    }
    return { valid: true };
  }
}

module.exports = HashService;
