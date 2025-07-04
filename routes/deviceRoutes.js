const express = require('express');
const Joi = require('joi');
const database = require('../database/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Schema de validação para dispositivos
const deviceSchema = Joi.object({
  device_id: Joi.string().min(1).max(50).required(),
  name: Joi.string().min(1).max(100).optional(),
  location: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(500).optional()
});

// RF007: GET - Listar todos os dispositivos
router.get('/', async (req, res) => {
  try {
    const devices = await database.all(`
      SELECT 
        d.*,
        COUNT(sd.id) as total_readings,
        MAX(sd.created_at) as last_reading
      FROM devices d
      LEFT JOIN sensor_data sd ON d.device_id = sd.device_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);

    res.json({
      success: true,
      data: devices
    });

  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar dispositivos'
    });
  }
});

// RF007: GET - Buscar dispositivo específico por ID
router.get('/:device_id', async (req, res) => {
  try {
    const { device_id } = req.params;

    const device = await database.get(`
      SELECT 
        d.*,
        COUNT(sd.id) as total_readings,
        MAX(sd.created_at) as last_reading,
        MIN(sd.created_at) as first_reading
      FROM devices d
      LEFT JOIN sensor_data sd ON d.device_id = sd.device_id
      WHERE d.device_id = ?
      GROUP BY d.id
    `, [device_id]);

    if (!device) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado',
        detail: `Dispositivo com ID ${device_id} não foi encontrado`
      });
    }

    res.json({
      success: true,
      data: device
    });

  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar dispositivo'
    });
  }
});

// RF007: POST - Criar novo dispositivo
router.post('/', validateRequest(deviceSchema), async (req, res) => {
  try {
    const { device_id, name, location, description } = req.body;

    // Verificar se o dispositivo já existe
    const existing = await database.get(
      'SELECT * FROM devices WHERE device_id = ?',
      [device_id]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Dispositivo já existe',
        detail: `Dispositivo com ID ${device_id} já está registrado`
      });
    }

    // Criar novo dispositivo
    const result = await database.run(
      `INSERT INTO devices (device_id, name, location, description) 
       VALUES (?, ?, ?, ?)`,
      [device_id, name, location, description]
    );

    // Buscar dispositivo criado
    const newDevice = await database.get(
      'SELECT * FROM devices WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Dispositivo criado com sucesso',
      data: newDevice
    });

  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao criar dispositivo'
    });
  }
});

// RF007: PATCH - Atualizar dispositivo
router.patch('/:device_id', validateRequest(deviceSchema), async (req, res) => {
  try {
    const { device_id } = req.params;
    const { name, location, description } = req.body;

    // Verificar se o dispositivo existe
    const existing = await database.get(
      'SELECT * FROM devices WHERE device_id = ?',
      [device_id]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado',
        detail: `Dispositivo com ID ${device_id} não foi encontrado`
      });
    }

    // Atualizar dispositivo
    await database.run(
      `UPDATE devices 
       SET name = ?, location = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE device_id = ?`,
      [name, location, description, device_id]
    );

    // Buscar dispositivo atualizado
    const updated = await database.get(
      'SELECT * FROM devices WHERE device_id = ?',
      [device_id]
    );

    res.json({
      success: true,
      message: 'Dispositivo atualizado com sucesso',
      data: updated
    });

  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao atualizar dispositivo'
    });
  }
});

// RF007: DELETE - Remover dispositivo
router.delete('/:device_id', async (req, res) => {
  try {
    const { device_id } = req.params;

    // Verificar se o dispositivo existe
    const existing = await database.get(
      'SELECT * FROM devices WHERE device_id = ?',
      [device_id]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado',
        detail: `Dispositivo com ID ${device_id} não foi encontrado`
      });
    }

    // Remover dados do sensor primeiro (devido à foreign key)
    await database.run(
      'DELETE FROM sensor_data WHERE device_id = ?',
      [device_id]
    );

    // Remover dispositivo
    await database.run(
      'DELETE FROM devices WHERE device_id = ?',
      [device_id]
    );

    res.json({
      success: true,
      message: 'Dispositivo e seus dados removidos com sucesso'
    });

  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao remover dispositivo'
    });
  }
});

// Rota para estatísticas do dispositivo
router.get('/:device_id/stats', async (req, res) => {
  try {
    const { device_id } = req.params;

    // Verificar se o dispositivo existe
    const device = await database.get(
      'SELECT * FROM devices WHERE device_id = ?',
      [device_id]
    );

    if (!device) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado',
        detail: `Dispositivo com ID ${device_id} não foi encontrado`
      });
    }

    // Buscar estatísticas dos dados
    const stats = await database.get(`
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
      WHERE device_id = ?
    `, [device_id]);

    // Buscar dados das últimas 24 horas
    const last24h = await database.all(`
      SELECT 
        temperatura,
        umidade_solo,
        created_at
      FROM sensor_data 
      WHERE device_id = ? 
      AND created_at >= datetime('now', '-1 day')
      ORDER BY created_at DESC
    `, [device_id]);

    res.json({
      success: true,
      data: {
        device,
        stats,
        last_24h: last24h
      }
    });

  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar estatísticas do dispositivo'
    });
  }
});

module.exports = router; 