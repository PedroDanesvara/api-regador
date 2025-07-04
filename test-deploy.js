const axios = require('axios');

// Configuração
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_DEVICE_ID = 'ESP32_TEST_' + Date.now();

console.log('🧪 Testando API:', API_URL);
console.log('📱 Device ID de teste:', TEST_DEVICE_ID);
console.log('---');

async function testAPI() {
  try {
    // 1. Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('---');

    // 2. Informações da API
    console.log('2️⃣ Testando informações da API...');
    const infoResponse = await axios.get(`${API_URL}/`);
    console.log('✅ API Info:', infoResponse.data);
    console.log('---');

    // 3. Criar dispositivo
    console.log('3️⃣ Criando dispositivo de teste...');
    const deviceData = {
      device_id: TEST_DEVICE_ID,
      name: 'Dispositivo de Teste',
      location: 'Teste Automatizado',
      description: 'Dispositivo criado para teste de deploy'
    };
    
    const deviceResponse = await axios.post(`${API_URL}/api/devices`, deviceData);
    console.log('✅ Dispositivo criado:', deviceResponse.data);
    console.log('---');

    // 4. Listar dispositivos
    console.log('4️⃣ Listando dispositivos...');
    const devicesResponse = await axios.get(`${API_URL}/api/devices`);
    console.log('✅ Dispositivos encontrados:', devicesResponse.data.length);
    console.log('---');

    // 5. Enviar dados do sensor
    console.log('5️⃣ Enviando dados do sensor...');
    const sensorData = {
      device_id: TEST_DEVICE_ID,
      temperatura: 25.5 + Math.random() * 5,
      umidade_solo: 60 + Math.floor(Math.random() * 20),
      timestamp: Date.now()
    };
    
    const sensorResponse = await axios.post(`${API_URL}/api/sensors`, sensorData);
    console.log('✅ Dados do sensor enviados:', sensorResponse.data);
    console.log('---');

    // 6. Listar dados dos sensores
    console.log('6️⃣ Listando dados dos sensores...');
    const sensorsResponse = await axios.get(`${API_URL}/api/sensors`);
    console.log('✅ Dados dos sensores encontrados:', sensorsResponse.data.length);
    console.log('---');

    // 7. Ativar bomba
    console.log('7️⃣ Testando ativação da bomba...');
    const pumpActivateResponse = await axios.post(`${API_URL}/api/pump/activate`, {
      device_id: TEST_DEVICE_ID,
      duration_seconds: 10,
      reason: 'Teste de deploy',
      triggered_by: 'manual'
    });
    console.log('✅ Bomba ativada:', pumpActivateResponse.data);
    console.log('---');

    // 8. Status da bomba
    console.log('8️⃣ Verificando status da bomba...');
    const pumpStatusResponse = await axios.get(`${API_URL}/api/pump/status`);
    console.log('✅ Status da bomba:', pumpStatusResponse.data);
    console.log('---');

    // 9. Desativar bomba
    console.log('9️⃣ Testando desativação da bomba...');
    const pumpDeactivateResponse = await axios.post(`${API_URL}/api/pump/deactivate`, {
      device_id: TEST_DEVICE_ID,
      reason: 'Teste de deploy concluído',
      triggered_by: 'manual'
    });
    console.log('✅ Bomba desativada:', pumpDeactivateResponse.data);
    console.log('---');

    console.log('🎉 Todos os testes passaram com sucesso!');
    console.log('🚀 API está funcionando corretamente no deploy.');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Dados:', error.response.data);
    }
    
    process.exit(1);
  }
}

// Executar testes
testAPI(); 