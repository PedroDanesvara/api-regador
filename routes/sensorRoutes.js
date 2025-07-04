const express = require('express');
const Joi = require('joi');
const database = require('../database/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Schema de validação para dados do sensor
const sensorDataSchema = Joi.object({
  temperatura: Joi.number().min(-50).max(100).required(),
  umidade_solo: Joi.number().integer().min(0).max(100).required(),
  timestamp: Joi.number().integer().min(0).required(),
  device_id: Joi.string().min(1).max(50).required()
});

// Schema para filtros de consulta
const querySchema = Joi.object({
  device_id: Joi.string().optional(),
  start_date: Joi.string().isoDate().optional(),
  end_date: Joi.string().isoDate().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

// RF005: POST - Receber dados do ESP32
router.post('/', validateRequest(sensorDataSchema), async (req, res) => {
  try {
    const { temperatura, umidade_solo, timestamp, device_id } = req.body;

    // Verificar se o dispositivo existe, se não, criar automaticamente
    const device = await database.get(
      'SELECT * FROM devices WHERE device_id = ?',
      [device_id]
    );

    if (!device) {
      await database.run(
        'INSERT INTO devices (device_id, name, location) VALUES (?, ?, ?)',
        [device_id, `ESP32_${device_id}`, 'Localização não definida']
      );
    }

    // Inserir dados do sensor
    const result = await database.run(
      `INSERT INTO sensor_data (device_id, temperatura, umidade_solo, timestamp) 
       VALUES (?, ?, ?, ?)`,
      [device_id, temperatura, umidade_solo, timestamp]
    );

    res.status(201).json({
      success: true,
      message: 'Dados recebidos com sucesso',
      data: {
        id: result.id,
        device_id,
        temperatura,
        umidade_solo,
        timestamp,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao salvar dados do sensor'
    });
  }
});

// RF006: GET - Enviar dados para aplicativo mobile (com filtros)
router.get('/', validateRequest(querySchema, 'query'), async (req, res) => {
  try {
    const { 
      device_id, 
      start_date, 
      end_date, 
      limit, 
      offset, 
      order 
    } = req.query;

    let sql = `
      SELECT 
        sd.id,
        sd.device_id,
        sd.temperatura,
        sd.umidade_solo,
        sd.timestamp,
        sd.created_at,
        d.name as device_name,
        d.location as device_location
      FROM sensor_data sd
      LEFT JOIN devices d ON sd.device_id = d.device_id
      WHERE 1=1
    `;
    const params = [];

    // Filtro por dispositivo (RF007)
    if (device_id) {
      sql += ' AND sd.device_id = ?';
      params.push(device_id);
    }

    // Filtro por data
    if (start_date) {
      sql += ' AND sd.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND sd.created_at <= ?';
      params.push(end_date);
    }

    // Ordenação e paginação
    sql += ` ORDER BY sd.created_at ${order.toUpperCase()}`;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const data = await database.all(sql, params);

    // Contar total de registros para paginação
    let countSql = 'SELECT COUNT(*) as total FROM sensor_data WHERE 1=1';
    const countParams = [];
    
    if (device_id) {
      countSql += ' AND device_id = ?';
      countParams.push(device_id);
    }

    if (start_date) {
      countSql += ' AND created_at >= ?';
      countParams.push(start_date);
    }

    if (end_date) {
      countSql += ' AND created_at <= ?';
      countParams.push(end_date);
    }

    const countResult = await database.get(countSql, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: data,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (offset + limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar dados dos sensores'
    });
  }
});

// RF005: GET - Buscar dados específicos por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const data = await database.get(
      `SELECT 
        sd.id,
        sd.device_id,
        sd.temperatura,
        sd.umidade_solo,
        sd.timestamp,
        sd.created_at,
        d.name as device_name,
        d.location as device_location
       FROM sensor_data sd
       LEFT JOIN devices d ON sd.device_id = d.device_id
       WHERE sd.id = ?`,
      [id]
    );

    if (!data) {
      return res.status(404).json({
        error: 'Dados não encontrados',
        detail: `Registro com ID ${id} não foi encontrado`
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching sensor data by ID:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar dados do sensor'
    });
  }
});

// RF005: PATCH - Atualizar dados específicos
router.patch('/:id', validateRequest(sensorDataSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { temperatura, umidade_solo, timestamp, device_id } = req.body;

    // Verificar se o registro existe
    const existing = await database.get(
      'SELECT * FROM sensor_data WHERE id = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Dados não encontrados',
        detail: `Registro com ID ${id} não foi encontrado`
      });
    }

    // Atualizar dados
    await database.run(
      `UPDATE sensor_data 
       SET temperatura = ?, umidade_solo = ?, timestamp = ?, device_id = ?
       WHERE id = ?`,
      [temperatura, umidade_solo, timestamp, device_id, id]
    );

    // Buscar dados atualizados
    const updated = await database.get(
      'SELECT * FROM sensor_data WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Dados atualizados com sucesso',
      data: updated
    });

  } catch (error) {
    console.error('Error updating sensor data:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao atualizar dados do sensor'
    });
  }
});

// RF005: DELETE - Remover dados específicos
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o registro existe
    const existing = await database.get(
      'SELECT * FROM sensor_data WHERE id = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Dados não encontrados',
        detail: `Registro com ID ${id} não foi encontrado`
      });
    }

    // Remover dados
    await database.run('DELETE FROM sensor_data WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Dados removidos com sucesso'
    });

  } catch (error) {
    console.error('Error deleting sensor data:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao remover dados do sensor'
    });
  }
});

// Rota para estatísticas dos dados
router.get('/stats/summary', async (req, res) => {
  try {
    const { device_id } = req.query;
    
    let sql = `
      SELECT 
        COUNT(*) as total_readings,
        AVG(temperatura) as avg_temperatura,
        MIN(temperatura) as min_temperatura,
        MAX(temperatura) as max_temperatura,
        AVG(umidade_solo) as avg_umidade,
        MIN(umidade_solo) as min_umidade,
        MAX(umidade_solo) as max_umidade,
        MIN(created_at) as first_reading,
        MAX(created_at) as last_reading
      FROM sensor_data
    `;
    const params = [];

    if (device_id) {
      sql += ' WHERE device_id = ?';
      params.push(device_id);
    }

    const stats = await database.get(sql, params);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching sensor stats:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar estatísticas dos sensores'
    });
  }
});

module.exports = router; 