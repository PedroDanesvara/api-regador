/**
 * Middleware para tratamento centralizado de erros
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Erro de validação do banco de dados
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Erro de validação',
      detail: 'Dados inválidos para o banco de dados'
    });
  }

  // Erro de chave única violada
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      error: 'Conflito de dados',
      detail: 'Registro já existe no banco de dados'
    });
  }

  // Erro de chave estrangeira
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({
      error: 'Erro de referência',
      detail: 'Referência inválida no banco de dados'
    });
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      detail: 'O corpo da requisição deve ser um JSON válido'
    });
  }

  // Erro padrão
  res.status(500).json({
    error: 'Erro interno do servidor',
    detail: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
}

module.exports = errorHandler; 