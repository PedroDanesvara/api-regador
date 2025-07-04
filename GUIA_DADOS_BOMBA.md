# 🚰 Guia Completo: Dados da Bomba

Este guia explica como obter, controlar e monitorar os dados da bomba de irrigação através da API.

## 📋 Endpoints Disponíveis

### 1. Status da Bomba
```http
GET /api/pump/{device_id}/status
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "device_id": "ESP32_002",
    "is_active": false,
    "status": "inactive",
    "duration_seconds": 0,
    "reason": "Sistema inicializado",
    "triggered_by": "automatic",
    "last_updated": "2024-01-01T12:00:00.000Z",
    "total_activations": 5,
    "last_activated": "2024-01-01T11:30:00.000Z",
    "last_deactivated": "2024-01-01T11:35:00.000Z"
  }
}
```

### 2. Controlar Bomba
```http
POST /api/pump/{device_id}/control
```

**Body:**
```json
{
  "action": "activate",
  "reason": "Umidade do solo baixa",
  "triggered_by": "automatic"
}
```

**Ações disponíveis:**
- `activate` - Ativar bomba
- `deactivate` - Desativar bomba

**Tipos de trigger:**
- `manual` - Controle manual pelo usuário
- `automatic` - Controle automático baseado em sensores
- `schedule` - Controle programado

### 3. Histórico da Bomba
```http
GET /api/pump/{device_id}/history?limit=50&offset=0
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "activated",
      "duration_seconds": 300,
      "reason": "Umidade do solo baixa",
      "triggered_by": "automatic",
      "created_at": "2024-01-01T11:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

### 4. Estatísticas da Bomba
```http
GET /api/pump/{device_id}/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "device": { /* dados do dispositivo */ },
    "stats": {
      "total_actions": 10,
      "total_activations": 5,
      "total_deactivations": 5,
      "total_duration_seconds": 1500,
      "avg_duration_seconds": 300,
      "max_duration_seconds": 600,
      "first_action": "2024-01-01T10:00:00.000Z",
      "last_action": "2024-01-01T12:00:00.000Z",
      "manual_actions": 2,
      "automatic_actions": 6,
      "scheduled_actions": 2
    },
    "last_24h": [ /* dados das últimas 24 horas */ ]
  }
}
```

## 🧪 Testando com PowerShell

### 1. Verificar Status
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/pump/ESP32_002/status" -Method GET
```

### 2. Ativar Bomba
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/pump/ESP32_002/control" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{
  "action": "activate",
  "reason": "Teste manual via PowerShell",
  "triggered_by": "manual"
}'
```

### 3. Desativar Bomba
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/pump/ESP32_002/control" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{
  "action": "deactivate",
  "reason": "Teste finalizado",
  "triggered_by": "manual"
}'
```

### 4. Buscar Histórico
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/pump/ESP32_002/history?limit=10" -Method GET
```

### 5. Buscar Estatísticas
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/pump/ESP32_002/stats" -Method GET
```

## 🧪 Testando com Script Node.js

Execute o script de teste automatizado:
```bash
cd api
npm run test-pump
```

Este script irá:
1. Verificar status inicial
2. Ativar a bomba
3. Aguardar 3 segundos
4. Verificar status
5. Aguardar 2 segundos
6. Desativar a bomba
7. Verificar status final
8. Buscar histórico
9. Buscar estatísticas

## 📊 Estrutura do Banco de Dados

### Tabela: pump_data
Armazena o status atual da bomba:
```sql
CREATE TABLE pump_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  duration_seconds INTEGER DEFAULT 0,
  reason TEXT,
  triggered_by TEXT CHECK (triggered_by IN ('manual', 'automatic', 'schedule')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices (device_id)
);
```

### Tabela: pump_history
Armazena o histórico completo de ações:
```sql
CREATE TABLE pump_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('activated', 'deactivated')),
  duration_seconds INTEGER DEFAULT 0,
  reason TEXT,
  triggered_by TEXT CHECK (triggered_by IN ('manual', 'automatic', 'schedule')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices (device_id)
);
```

## 🔄 Fluxo de Funcionamento

### 1. Inicialização
- Quando um device é criado, um registro inicial é criado na tabela `pump_data`
- Status inicial: `inactive`
- Razão: "Sistema inicializado"

### 2. Ativação da Bomba
1. Cliente envia POST para `/api/pump/{device_id}/control`
2. API verifica se a bomba não está já ativa
3. Atualiza status para `active` na tabela `pump_data`
4. Registra ação `activated` na tabela `pump_history`
5. Retorna confirmação

### 3. Desativação da Bomba
1. Cliente envia POST para `/api/pump/{device_id}/control`
2. API verifica se a bomba está ativa
3. Calcula duração da sessão
4. Atualiza status para `inactive` na tabela `pump_data`
5. Registra ação `deactivated` na tabela `pump_history`
6. Retorna confirmação

### 4. Consulta de Status
1. Cliente envia GET para `/api/pump/{device_id}/status`
2. API busca status atual na tabela `pump_data`
3. Calcula estatísticas da tabela `pump_history`
4. Retorna dados consolidados

## 📱 Integração com Aplicativos

### Flutter App
```dart
// Obter status da bomba
final pumpStatus = await apiService.getPumpStatus(deviceId);

// Controlar bomba
final success = await apiService.togglePump(deviceId);

// Buscar histórico
final history = await apiService.getPumpHistory(deviceId);
```

### React Native App
```javascript
// Obter status da bomba
const pumpStatus = await apiService.getPumpStatus(deviceId);

// Controlar bomba
const success = await apiService.togglePump(deviceId);

// Buscar histórico
const history = await apiService.getPumpHistory(deviceId);
```

## 🎯 Casos de Uso

### 1. Controle Manual
- Usuário ativa/desativa bomba via app
- Trigger: `manual`
- Razão: "Controle manual do usuário"

### 2. Controle Automático
- Sistema ativa bomba baseado em umidade do solo
- Trigger: `automatic`
- Razão: "Umidade do solo abaixo de 30%"

### 3. Controle Programado
- Bomba ativa em horários específicos
- Trigger: `schedule`
- Razão: "Irrigação programada - 06:00"

### 4. Monitoramento
- Dashboard mostra status atual
- Histórico de ativações
- Estatísticas de uso
- Alertas de falhas

## 🔧 Configurações Avançadas

### Personalizar Duração Máxima
```javascript
// No código da API, adicionar validação
if (durationSeconds > MAX_DURATION_SECONDS) {
  // Desativar automaticamente
}
```

### Adicionar Notificações
```javascript
// Enviar notificação quando bomba ativa por muito tempo
if (durationSeconds > WARNING_THRESHOLD) {
  sendNotification('Bomba ativa há muito tempo');
}
```

### Logs Detalhados
```javascript
// Registrar logs para auditoria
console.log(`Bomba ${action} para device ${deviceId} - ${reason}`);
```

## 🚨 Tratamento de Erros

### Erros Comuns
- **404**: Device não encontrado
- **400**: Ação inválida (bomba já está no estado desejado)
- **500**: Erro interno do servidor

### Validações
- Status deve ser `active` ou `inactive`
- Action deve ser `activate` ou `deactivate`
- Triggered_by deve ser `manual`, `automatic` ou `schedule`
- Device_id deve existir na tabela devices

## 📈 Métricas Importantes

### Para Monitoramento
- **Total de ativações**: Frequência de uso
- **Duração média**: Eficiência da irrigação
- **Duração máxima**: Identificar problemas
- **Distribuição por trigger**: Análise de padrões

### Para Manutenção
- **Frequência de ativação**: Planejar manutenção
- **Duração das sessões**: Otimizar irrigação
- **Padrões de uso**: Identificar anomalias

## 🎉 Próximos Passos

1. **Testar funcionalidades** com o script de teste
2. **Integrar com aplicativos** mobile
3. **Configurar controle automático** baseado em sensores
4. **Implementar notificações** para eventos importantes
5. **Criar dashboard** para visualização de dados 