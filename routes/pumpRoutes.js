const express = require('express');
const Joi = require('joi');
const database = require('../database/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Schema de validação para controle da bomba
const pumpControlSchema = Joi.object({
  action: Joi.string().valid('activate', 'deactivate').required(),
  reason: Joi.string().max(200).optional(),
  triggered_by: Joi.string().valid('manual', 'automatic', 'schedule').default('manual')
});

// Schema para dados da bomba
const pumpDataSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required(),
  duration_seconds: Joi.number().integer().min(0).default(0),
  reason: Joi.string().max(200).optional(),
  triggered_by: Joi.string().valid('manual', 'automatic', 'schedule').default('manual')
});

// RF009: GET - Obter status atual da bomba
router.get('/:device_id/status', async (req, res) => {
  try {
    const { device_id } = req.params;

    // Verificar se o dispositivo existe
    const device = await database.get(
      'SELECT * FROM devices WHERE device_id = $1',
      [device_id]
    );

    if (!device) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado',
        detail: `Dispositivo com ID ${device_id} não foi encontrado`
      });
    }

    // Buscar status atual da bomba
    const pumpStatus = await database.get(`
      SELECT * FROM pump_data 
      WHERE device_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `, [device_id]);

    // Se não há dados da bomba, criar registro inicial
    if (!pumpStatus) {
      const result = await database.run(`
        INSERT INTO pump_data (device_id, status, duration_seconds, reason, triggered_by)
        VALUES ($1, 'inactive', 0, 'Sistema inicializado', 'automatic')
      `, [device_id]);

      const newStatus = await database.get(
        'SELECT * FROM pump_data WHERE id = $1',
        [result.id]
      );

      return res.json({
        success: true,
        data: {
          device_id,
          is_active: false,
          status: 'inactive',
          duration_seconds: 0,
          reason: 'Sistema inicializado',
          triggered_by: 'automatic',
          last_updated: newStatus.created_at,
          total_activations: 0,
          last_activated: null,
          last_deactivated: null
        }
      });
    }

    // Buscar estatísticas da bomba
    const stats = await database.get(`
      SELECT 
        COUNT(CASE WHEN action = 'activated' THEN 1 END) as total_activations,
        MAX(CASE WHEN action = 'activated' THEN created_at END) as last_activated,
        MAX(CASE WHEN action = 'deactivated' THEN created_at END) as last_deactivated
      FROM pump_history 
      WHERE device_id = $1
    `, [device_id]);

    res.json({
      success: true,
      data: {
        device_id,
        is_active: pumpStatus.status === 'active',
        status: pumpStatus.status,
        duration_seconds: pumpStatus.duration_seconds,
        reason: pumpStatus.reason,
        triggered_by: pumpStatus.triggered_by,
        last_updated: pumpStatus.updated_at,
        total_activations: stats.total_activations || 0,
        last_activated: stats.last_activated,
        last_deactivated: stats.last_deactivated
      }
    });

  } catch (error) {
    console.error('Error fetching pump status:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar status da bomba'
    });
  }
});

// RF009: POST - Controlar bomba (ativar/desativar)
router.post('/:device_id/control', validateRequest(pumpControlSchema), async (req, res) => {
  try {
    const { device_id } = req.params;
    const { action, reason, triggered_by } = req.body;

    // Verificar se o dispositivo existe
    const device = await database.get(
      'SELECT * FROM devices WHERE device_id = $1',
      [device_id]
    );

    if (!device) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado',
        detail: `Dispositivo com ID ${device_id} não foi encontrado`
      });
    }

    // Buscar status atual da bomba
    const currentStatus = await database.get(`
      SELECT * FROM pump_data 
      WHERE device_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `, [device_id]);

    const newStatus = action === 'activate' ? 'active' : 'inactive';
    const actionType = action === 'activate' ? 'activated' : 'deactivated';

    // Se a bomba já está no estado desejado, retornar erro
    if (currentStatus && currentStatus.status === newStatus) {
      return res.status(400).json({
        error: 'Ação inválida',
        detail: `A bomba já está ${newStatus === 'active' ? 'ativa' : 'inativa'}`
      });
    }

    // Calcular duração se está desativando
    let durationSeconds = 0;
    if (action === 'deactivate' && currentStatus && currentStatus.status === 'active') {
      const startTime = new Date(currentStatus.updated_at);
      const endTime = new Date();
      durationSeconds = Math.floor((endTime - startTime) / 1000);
    }

    // Atualizar status da bomba
    if (currentStatus) {
      await database.run(`
        UPDATE pump_data 
        SET status = $1, duration_seconds = $2, reason = $3, triggered_by = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [newStatus, durationSeconds, reason || `Bomba ${actionType}`, triggered_by, currentStatus.id]);
    } else {
      await database.run(`
        INSERT INTO pump_data (device_id, status, duration_seconds, reason, triggered_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [device_id, newStatus, durationSeconds, reason || `Bomba ${actionType}`, triggered_by]);
    }

    // Registrar no histórico
    await database.run(`
      INSERT INTO pump_history (device_id, action, duration_seconds, reason, triggered_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [device_id, actionType, durationSeconds, reason || `Bomba ${actionType}`, triggered_by]);

    // Buscar status atualizado
    const updatedStatus = await database.get(`
      SELECT * FROM pump_data 
      WHERE device_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `, [device_id]);

    res.json({
      success: true,
      message: `Bomba ${actionType} com sucesso`,
      data: {
        device_id,
        is_active: updatedStatus.status === 'active',
        status: updatedStatus.status,
        duration_seconds: updatedStatus.duration_seconds,
        reason: updatedStatus.reason,
        triggered_by: updatedStatus.triggered_by,
        last_updated: updatedStatus.updated_at
      }
    });

  } catch (error) {
    console.error('Error controlling pump:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao controlar bomba'
    });
  }
});

// GET - Obter histórico da bomba
router.get('/:device_id/history', async (req, res) => {
  try {
    const { device_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verificar se o dispositivo existe
    const device = await database.get(
      'SELECT * FROM devices WHERE device_id = $1',
      [device_id]
    );

    if (!device) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado',
        detail: `Dispositivo com ID ${device_id} não foi encontrado`
      });
    }

    // Buscar histórico
    const history = await database.all(`
      SELECT 
        id,
        action,
        duration_seconds,
        reason,
        triggered_by,
        created_at
      FROM pump_history 
      WHERE device_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [device_id, parseInt(limit), parseInt(offset)]);

    // Contar total de registros
    const total = await database.get(`
      SELECT COUNT(*) as count FROM pump_history WHERE device_id = $1
    `, [device_id]);

    res.json({
      success: true,
      data: history,
      pagination: {
        total: total.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + parseInt(limit)) < total.count
      }
    });

  } catch (error) {
    console.error('Error fetching pump history:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar histórico da bomba'
    });
  }
});

// GET - Estatísticas da bomba
router.get('/:device_id/stats', async (req, res) => {
  try {
    const { device_id } = req.params;

    // Verificar se o dispositivo existe
    const device = await database.get(
      'SELECT * FROM devices WHERE device_id = $1',
      [device_id]
    );

    if (!device) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado',
        detail: `Dispositivo com ID ${device_id} não foi encontrado`
      });
    }

    // Buscar estatísticas
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(CASE WHEN action = 'activated' THEN 1 END) as total_activations,
        COUNT(CASE WHEN action = 'deactivated' THEN 1 END) as total_deactivations,
        SUM(duration_seconds) as total_duration_seconds,
        AVG(duration_seconds) as avg_duration_seconds,
        MAX(duration_seconds) as max_duration_seconds,
        MIN(created_at) as first_action,
        MAX(created_at) as last_action,
        COUNT(CASE WHEN triggered_by = 'manual' THEN 1 END) as manual_actions,
        COUNT(CASE WHEN triggered_by = 'automatic' THEN 1 END) as automatic_actions,
        COUNT(CASE WHEN triggered_by = 'schedule' THEN 1 END) as scheduled_actions
      FROM pump_history 
      WHERE device_id = $1
    `, [device_id]);

    // Buscar dados das últimas 24 horas
    const last24h = await database.all(`
      SELECT 
        action,
        duration_seconds,
        reason,
        triggered_by,
        created_at
      FROM pump_history 
      WHERE device_id = $1 
      AND created_at >= datetime('now', '-1 day')
      ORDER BY created_at DESC
    `, [device_id]);

    res.json({
      success: true,
      data: {
        device,
        stats: {
          total_actions: stats.total_actions || 0,
          total_activations: stats.total_activations || 0,
          total_deactivations: stats.total_deactivations || 0,
          total_duration_seconds: stats.total_duration_seconds || 0,
          avg_duration_seconds: Math.round(stats.avg_duration_seconds || 0),
          max_duration_seconds: stats.max_duration_seconds || 0,
          first_action: stats.first_action,
          last_action: stats.last_action,
          manual_actions: stats.manual_actions || 0,
          automatic_actions: stats.automatic_actions || 0,
          scheduled_actions: stats.scheduled_actions || 0
        },
        last_24h: last24h
      }
    });

  } catch (error) {
    console.error('Error fetching pump stats:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detail: 'Falha ao buscar estatísticas da bomba'
    });
  }
});

module.exports = router; 