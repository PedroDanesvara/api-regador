#!/usr/bin/env node

const readline = require('readline');
const axios = require('axios');

const API_BASE_URL = 'https://api-regador.vercel.app/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createDevice() {
  console.log('🚀 Criador de Novo Device ESP32\n');
  
  try {
    // Coletar informações do device
    const deviceId = await question('Digite o ID do device (ex: ESP32_001): ');
    const name = await question('Digite o nome do device (ex: ESP32 Sala): ');
    const location = await question('Digite a localização (ex: Sala de estar): ');
    const description = await question('Digite a descrição (opcional): ');
    
    // Validar campos obrigatórios
    if (!deviceId || !name || !location) {
      console.log('❌ Erro: device_id, name e location são obrigatórios!');
      rl.close();
      return;
    }
    
    // Preparar dados
    const deviceData = {
      device_id: deviceId,
      name: name,
      location: location,
      description: description || null
    };
    
    console.log('\n📤 Enviando dados para a API...');
    
    // Fazer requisição para a API
    const response = await axios.post(`${API_BASE_URL}/devices`, deviceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 201) {
      console.log('✅ Device criado com sucesso!');
      console.log('\n📋 Detalhes do device:');
      console.log(`   ID: ${response.data.data.device_id}`);
      console.log(`   Nome: ${response.data.data.name}`);
      console.log(`   Localização: ${response.data.data.location}`);
      console.log(`   Descrição: ${response.data.data.description || 'N/A'}`);
      console.log(`   Criado em: ${response.data.data.created_at}`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Erro na API:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Mensagem: ${error.response.data.error || 'Erro desconhecido'}`);
      if (error.response.data.detail) {
        console.log(`   Detalhes: ${error.response.data.detail}`);
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Erro: Não foi possível conectar à API');
      console.log('   Verifique se o servidor está rodando em http://localhost:3000');
    } else {
      console.log('❌ Erro inesperado:', error.message);
    }
  } finally {
    rl.close();
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

// Executar o script
createDevice(); 