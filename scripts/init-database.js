#!/usr/bin/env node

const database = require('../database/database');
const path = require('path');

async function initDatabase() {
  try {
    console.log('🗄️  Inicializando banco de dados...');
    
    // Inicializar banco de dados
    await database.init();
    
    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log(`📁 Arquivo: ${path.resolve(database.dbPath)}`);
    
    // Criar alguns dispositivos de exemplo
    console.log('📱 Criando dispositivos de exemplo...');
    
    const devices = [
      {
        device_id: 'ESP32_001',
        name: 'ESP32 Sala de Estar',
        location: 'Sala de estar - 1º andar',
        description: 'Monitoramento de umidade da sala'
      },
      {
        device_id: 'ESP32_002',
        name: 'ESP32 Jardim',
        location: 'Jardim externo',
        description: 'Monitoramento do solo do jardim'
      }
    ];
    
    for (const device of devices) {
      try {
        await database.run(
          'INSERT OR IGNORE INTO devices (device_id, name, location, description) VALUES (?, ?, ?, ?)',
          [device.device_id, device.name, device.location, device.description]
        );
        console.log(`✅ Dispositivo ${device.device_id} criado/verificado`);
      } catch (error) {
        console.log(`⚠️  Dispositivo ${device.device_id} já existe`);
      }
    }
    
    // Criar alguns dados de exemplo
    console.log('📊 Criando dados de exemplo...');
    
    const now = Date.now();
    const sampleData = [
      {
        device_id: 'ESP32_001',
        umidade_solo: 65,
        timestamp: now - 300000 // 5 minutos atrás
      },
      {
        device_id: 'ESP32_001',
        umidade_solo: 62,
        timestamp: now - 600000 // 10 minutos atrás
      },
      {
        device_id: 'ESP32_002',
        umidade_solo: 45,
        timestamp: now - 300000 // 5 minutos atrás
      },
      {
        device_id: 'ESP32_002',
        umidade_solo: 48,
        timestamp: now - 600000 // 10 minutos atrás
      }
    ];
    
    for (const data of sampleData) {
      try {
        await database.run(
          'INSERT INTO sensor_data (device_id, umidade_solo, timestamp) VALUES (?, ?, ?)',
          [data.device_id, data.umidade_solo, data.timestamp]
        );
        console.log(`✅ Dados de exemplo criados para ${data.device_id}`);
      } catch (error) {
        console.log(`⚠️  Erro ao criar dados para ${data.device_id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Inicialização concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Inicie o servidor: npm run dev');
    console.log('2. Teste a API: curl http://localhost:3000/health');
    console.log('3. Configure o ESP32 com a URL: http://localhost:3000/api/sensors');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase; 