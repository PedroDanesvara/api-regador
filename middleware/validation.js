const Joi = require('joi');

/**
 * Middleware para validar requisições usando Joi
 * @param {Object} schema - Schema Joi para validação
 * @param {string} source - Fonte dos dados ('body', 'query', 'params')
 * @returns {Function} Middleware function
 */
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Dados inválidos',
        detail: 'Verifique os campos obrigatórios e formatos',
        validation_errors: errorDetails
      });
    }

    // Substituir dados originais pelos dados validados
    req[source] = value;
    next();
  };
}

module.exports = {
  validateRequest
}; 