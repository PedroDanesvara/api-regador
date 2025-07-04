const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../data/monitoring.db');
  }

  async init() {
    return new Promise((resolve, reject) => {
      // Criar diretório de dados se não existir
      const fs = require('fs');
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const queries = [
      // Tabela de dispositivos ESP32
      `CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT UNIQUE NOT NULL,
        name TEXT,
        location TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de dados dos sensores
      `CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        temperatura REAL,
        umidade_solo INTEGER,
        timestamp BIGINT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (device_id)
      )`,

      // Tabela de dados da bomba
      `CREATE TABLE IF NOT EXISTS pump_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
        duration_seconds INTEGER DEFAULT 0,
        reason TEXT,
        triggered_by TEXT CHECK (triggered_by IN ('manual', 'automatic', 'schedule')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (device_id)
      )`,

      // Tabela de histórico da bomba
      `CREATE TABLE IF NOT EXISTS pump_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('activated', 'deactivated')),
        duration_seconds INTEGER DEFAULT 0,
        reason TEXT,
        triggered_by TEXT CHECK (triggered_by IN ('manual', 'automatic', 'schedule')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (device_id)
      )`,

      // Índices para melhor performance
      `CREATE INDEX IF NOT EXISTS idx_device_id ON sensor_data (device_id)`,
      `CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_data (timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_created_at ON sensor_data (created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_pump_device_id ON pump_data (device_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pump_history_device_id ON pump_history (device_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pump_history_created_at ON pump_history (created_at)`
    ];

    for (const query of queries) {
      await this.run(query);
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = new Database(); 