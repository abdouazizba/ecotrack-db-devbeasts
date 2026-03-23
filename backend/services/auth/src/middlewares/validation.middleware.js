/**
 * Validation Middleware
 * Valide body, params, query avec les schémas Joi
 * Retourne 400 avec détails des erreurs si validation échoue
 */

const { ValidationError } = require('../errors/AppError');

/**
 * Créer un middleware de validation pour une source donnée
 * @param {Joi.ObjectSchema} schema - Schéma Joi
 * @param {string} source - 'body', 'params', 'query'
 * @returns {function} Middleware Express
 * 
 * Usage:
 * router.post('/register', validate(registerSchema, 'body'), controller.register)
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      // Récupérer les données à valider
      const dataToValidate = req[source];

      // Valider avec Joi
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Retourner TOUTES les erreurs, pas juste la première
        stripUnknown: true // Ignorer les champs non définis dans le schéma
      });

      // S'il y a des erreurs
      if (error) {
        const details = error.details.map(err => ({
          field: err.path.join('.'), // ex: 'email'
          message: err.message,
          type: err.type // 'string.email', 'any.required', etc
        }));

        throw new ValidationError('Validation failed', details);
      }

      // Remplacer les données avec les données validées (cleaned/transformed)
      req[source] = value;

      // Passer au middleware suivant
      next();
    } catch (error) {
      next(error); // Passer au error handler middleware
    }
  };
}

module.exports = validate;
