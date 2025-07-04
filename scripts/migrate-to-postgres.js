const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Configuração do SQLite (origem)
const sqlitePath = path.join(__dirname, '../data/monitoring.db');

// Configuração do PostgreSQL (destino)
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'monitoring_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateData() {
  console.log('🔄 Iniciando migração de SQLite para PostgreSQL...');
  
  // Abrir conexão SQLite
  const sqliteDb = new sqlite3.Database(sqlitePath, (err) => {
    if (err) {
      console.error('❌ Erro ao abrir SQLite:', err);
      process.exit(1);
    }
    console.log('✅ SQLite conectado');
  });

  try {
    // Testar conexão PostgreSQL
    const pgClient = await pgPool.connect();
    console.log('✅ PostgreSQL conectado');
    pgClient.release();

    // Migrar dispositivos
    console.log('📱 Migrando dispositivos...');
    const devices = await getSqliteData(sqliteDb, 'SELECT * FROM devices');
    for (const device of devices) {
      await insertPostgresData(
        'INSERT INTO devices (device_id, name, location, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (device_id) DO NOTHING',
        [device.device_id, device.name, device.location, device.description, device.created_at, device.updated_at]
      );
    }
    console.log(`✅ ${devices.length} dispositivos migrados`);

    // Migrar dados dos sensores
    console.log('🌡️ Migrando dados dos sensores...');
    const sensorData = await getSqliteData(sqliteDb, 'SELECT * FROM sensor_data');
    for (const data of sensorData) {
      await insertPostgresData(
        'INSERT INTO sensor_data (device_id, temperatura, umidade_solo, timestamp, created_at) VALUES ($1, $2, $3, $4, $5)',
        [data.device_id, data.temperatura, data.umidade_solo, data.timestamp, data.created_at]
      );
    }
    console.log(`✅ ${sensorData.length} registros de sensores migrados`);

    // Migrar dados da bomba
    console.log('💧 Migrando dados da bomba...');
    const pumpData = await getSqliteData(sqliteDb, 'SELECT * FROM pump_data');
    for (const data of pumpData) {
      await insertPostgresData(
        'INSERT INTO pump_data (device_id, status, duration_seconds, reason, triggered_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [data.device_id, data.status, data.duration_seconds, data.reason, data.triggered_by, data.created_at, data.updated_at]
      );
    }
    console.log(`✅ ${pumpData.length} registros de bomba migrados`);

    // Migrar histórico da bomba
    console.log('📊 Migrando histórico da bomba...');
    const pumpHistory = await getSqliteData(sqliteDb, 'SELECT * FROM pump_history');
    for (const history of pumpHistory) {
      await insertPostgresData(
        'INSERT INTO pump_history (device_id, action, duration_seconds, reason, triggered_by, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [history.device_id, history.action, history.duration_seconds, history.reason, history.triggered_by, history.created_at]
      );
    }
    console.log(`✅ ${pumpHistory.length} registros de histórico migrados`);

    // Verificar estatísticas finais
    console.log('📈 Verificando estatísticas finais...');
    const stats = await getPostgresStats();
    console.log('📊 Estatísticas do PostgreSQL:');
    console.log(`   - Dispositivos: ${stats.devices}`);
    console.log(`   - Dados de sensores: ${stats.sensorData}`);
    console.log(`   - Histórico de bombas: ${stats.pumpHistory}`);

    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    // Fechar conexões
    sqliteDb.close((err) => {
      if (err) {
        console.error('Erro ao fechar SQLite:', err);
      } else {
        console.log('✅ Conexão SQLite fechada');
      }
    });
    
    await pgPool.end();
    console.log('✅ Conexão PostgreSQL fechada');
  }
}

function getSqliteData(db, query) {
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

async function insertPostgresData(query, params) {
  const client = await pgPool.connect();
  try {
    await client.query(query, params);
  } finally {
    client.release();
  }
}

async function getPostgresStats() {
  const client = await pgPool.connect();
  try {
    const stats = {};
    
    const devicesResult = await client.query('SELECT COUNT(*) as count FROM devices');
    stats.devices = parseInt(devicesResult.rows[0].count);

    const sensorsResult = await client.query('SELECT COUNT(*) as count FROM sensor_data');
    stats.sensorData = parseInt(sensorsResult.rows[0].count);

    const pumpHistoryResult = await client.query('SELECT COUNT(*) as count FROM pump_history');
    stats.pumpHistory = parseInt(pumpHistoryResult.rows[0].count);

    return stats;
  } finally {
    client.release();
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData }; 