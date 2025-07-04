#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
const DEVICE_ID = 'ESP32_002'; // Usar um device existente

async function testPumpFunctionality() {
  console.log('🧪 Testando Funcionalidades da Bomba\n');

  try {
    // Teste 1: Verificar status inicial da bomba
    console.log('1️⃣ Verificando status inicial da bomba...');
    const statusResponse = await axios.get(`${API_BASE_URL}/pump/${DEVICE_ID}/status`);
    console.log('✅ Status inicial:', statusResponse.data.data);
    console.log('');

    // Teste 2: Ativar bomba
    console.log('2️⃣ Ativando bomba...');
    const activateResponse = await axios.post(`${API_BASE_URL}/pump/${DEVICE_ID}/control`, {
      action: 'activate',
      reason: 'Teste manual via script',
      triggered_by: 'manual'
    });
    console.log('✅ Bomba ativada:', activateResponse.data.message);
    console.log('');

    // Aguardar 3 segundos
    console.log('⏳ Aguardando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Teste 3: Verificar status após ativação
    console.log('3️⃣ Verificando status após ativação...');
    const statusAfterActivation = await axios.get(`${API_BASE_URL}/pump/${DEVICE_ID}/status`);
    console.log('✅ Status após ativação:', statusAfterActivation.data.data);
    console.log('');

    // Aguardar mais 2 segundos
    console.log('⏳ Aguardando mais 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 4: Desativar bomba
    console.log('4️⃣ Desativando bomba...');
    const deactivateResponse = await axios.post(`${API_BASE_URL}/pump/${DEVICE_ID}/control`, {
      action: 'deactivate',
      reason: 'Teste manual via script - finalizado',
      triggered_by: 'manual'
    });
    console.log('✅ Bomba desativada:', deactivateResponse.data.message);
    console.log('');

    // Teste 5: Verificar status final
    console.log('5️⃣ Verificando status final...');
    const finalStatus = await axios.get(`${API_BASE_URL}/pump/${DEVICE_ID}/status`);
    console.log('✅ Status final:', finalStatus.data.data);
    console.log('');

    // Teste 6: Buscar histórico
    console.log('6️⃣ Buscando histórico da bomba...');
    const historyResponse = await axios.get(`${API_BASE_URL}/pump/${DEVICE_ID}/history?limit=10`);
    console.log('✅ Histórico (últimos 10 registros):');
    historyResponse.data.data.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.action} - ${record.reason} (${record.triggered_by}) - ${record.created_at}`);
    });
    console.log('');

    // Teste 7: Buscar estatísticas
    console.log('7️⃣ Buscando estatísticas da bomba...');
    const statsResponse = await axios.get(`${API_BASE_URL}/pump/${DEVICE_ID}/stats`);
    console.log('✅ Estatísticas:', statsResponse.data.data.stats);
    console.log('');

    console.log('🎉 Todos os testes da bomba foram executados com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

// Verificar se axios está instalado
try {
  require('axios');
} catch (error) {
  console.log('❌ Erro: axios não está instalado');
  console.log('   Execute: npm install axios');
  process.exit(1);
}

// Executar os testes
testPumpFunctionality(); 