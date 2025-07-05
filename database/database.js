const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      // Configuração do PostgreSQL
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'monitoring_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // máximo de conexões no pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Testar conexão
      const client = await this.pool.connect();
      console.log('✅ Connected to PostgreSQL database');
      client.release();

      // Criar tabelas
      await this.createTables();
      this.isInitialized = true;
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      // Tabela de dispositivos ESP32
      `CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        location VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de dados dos sensores
      `CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) NOT NULL,
        temperatura DECIMAL(5,2),
        umidade_solo INTEGER,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
      )`,

      // Tabela de dados da bomba
      `CREATE TABLE IF NOT EXISTS pump_data (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive')),
        duration_seconds INTEGER DEFAULT 0,
        reason TEXT,
        triggered_by VARCHAR(50) CHECK (triggered_by IN ('manual', 'automatic', 'schedule')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
      )`,

      // Tabela de histórico da bomba
      `CREATE TABLE IF NOT EXISTS pump_history (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL CHECK (action IN ('activated', 'deactivated')),
        duration_seconds INTEGER DEFAULT 0,
        reason TEXT,
        triggered_by VARCHAR(50) CHECK (triggered_by IN ('manual', 'automatic', 'schedule')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
      )`,

      // Índices para melhor performance
      `CREATE INDEX IF NOT EXISTS idx_device_id ON sensor_data (device_id)`,
      `CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_data (timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_created_at ON sensor_data (created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_pump_device_id ON pump_data (device_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pump_history_device_id ON pump_history (device_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pump_history_created_at ON pump_history (created_at)`,

      // Trigger para atualizar updated_at automaticamente
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
           NEW.updated_at = CURRENT_TIMESTAMP;
           RETURN NEW;
       END;
       $$ language 'plpgsql'`,

      // Trigger para devices
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_devices_updated_at') THEN
          CREATE TRIGGER update_devices_updated_at
          BEFORE UPDATE ON devices
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END;
      $$;`,

      // Trigger para pump_data
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pump_data_updated_at') THEN
          CREATE TRIGGER update_pump_data_updated_at
          BEFORE UPDATE ON pump_data
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END;
      $$;`
    ];

    const client = await this.pool.connect();
    try {
      for (const query of queries) {
        await client.query(query);
      }
      console.log('✅ Tables and indexes created successfully');
    } finally {
      client.release();
    }
  }

  async run(sql, params = []) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return { 
        id: result.rows[0]?.id || null, 
        changes: result.rowCount 
      };
    } finally {
      client.release();
    }
  }

  async get(sql, params = []) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async all(sql, params = []) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ Database connection closed');
    }
  }

  // Método para verificar se o banco está conectado
  async isConnected() {
    try {
      const client = await this.pool.connect();
      client.release();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Método para obter estatísticas do banco
  async getStats() {
    try {
      const stats = {};
      
      // Contar dispositivos
      const devicesResult = await this.all('SELECT COUNT(*) as count FROM devices');
      stats.devices = parseInt(devicesResult[0].count);

      // Contar dados de sensores
      const sensorsResult = await this.all('SELECT COUNT(*) as count FROM sensor_data');
      stats.sensorData = parseInt(sensorsResult[0].count);

      // Contar histórico de bombas
      const pumpHistoryResult = await this.all('SELECT COUNT(*) as count FROM pump_history');
      stats.pumpHistory = parseInt(pumpHistoryResult[0].count);

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }
}

module.exports = new Database(); 