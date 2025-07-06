#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'monitoring_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function removeTemperaturaColumn() {
  console.log('🗄️  Removendo coluna temperatura do banco de dados...');
  
  try {
    // Testar conexão
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Verificar se a coluna existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sensor_data' 
      AND column_name = 'temperatura'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('📋 Coluna temperatura encontrada. Removendo...');
      
      // Remover a coluna
      await client.query('ALTER TABLE sensor_data DROP COLUMN temperatura');
      console.log('✅ Coluna temperatura removida com sucesso!');
    } else {
      console.log('ℹ️  Coluna temperatura não existe na tabela sensor_data');
    }
    
    // Verificar estrutura da tabela
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sensor_data' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Estrutura atual da tabela sensor_data:');
    structure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro ao remover coluna temperatura:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('✅ Conexão com banco de dados fechada');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  removeTemperaturaColumn();
}

module.exports = { removeTemperaturaColumn }; 