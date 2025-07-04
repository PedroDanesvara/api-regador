# 📱 Guia para Criar Novo Device ESP32

Este guia explica como criar novos devices ESP32 na API de monitoramento.

## 🚀 Métodos para Criar Device

### 1. Via API REST (Recomendado)

#### Usando PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/devices" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{
  "device_id": "ESP32_001",
  "name": "ESP32 Sala de Estar",
  "location": "Sala de estar - 1º andar",
  "description": "Monitoramento de temperatura e umidade da sala"
}'
```

#### Usando curl (se disponível):
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_001",
    "name": "ESP32 Sala de Estar",
    "location": "Sala de estar - 1º andar",
    "description": "Monitoramento de temperatura e umidade da sala"
  }'
```

### 2. Via Script Node.js

Execute o script interativo:
```bash
cd api
npm run create-device
```

O script irá solicitar:
- **device_id**: ID único do device (ex: ESP32_001)
- **name**: Nome amigável do device
- **location**: Localização física do device
- **description**: Descrição opcional

### 3. Via Postman ou Insomnia

**URL:** `POST http://localhost:3000/api/devices`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "device_id": "ESP32_001",
  "name": "ESP32 Sala de Estar",
  "location": "Sala de estar - 1º andar",
  "description": "Monitoramento de temperatura e umidade da sala"
}
```

## 📋 Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `device_id` | String | ID único do device (máx 50 chars) | "ESP32_001" |
| `name` | String | Nome amigável (máx 100 chars) | "ESP32 Sala de Estar" |
| `location` | String | Localização física (máx 200 chars) | "Sala de estar - 1º andar" |
| `description` | String | Descrição opcional (máx 500 chars) | "Monitoramento de temperatura e umidade" |

## ✅ Resposta de Sucesso

```json
{
  "success": true,
  "message": "Dispositivo criado com sucesso",
  "data": {
    "id": 1,
    "device_id": "ESP32_001",
    "name": "ESP32 Sala de Estar",
    "location": "Sala de estar - 1º andar",
    "description": "Monitoramento de temperatura e umidade da sala",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

## ❌ Possíveis Erros

### 409 - Device já existe
```json
{
  "error": "Dispositivo já existe",
  "detail": "Dispositivo com ID ESP32_001 já está registrado"
}
```

### 400 - Dados inválidos
```json
{
  "error": "Dados inválidos",
  "detail": "Verifique os campos obrigatórios e formatos",
  "validation_errors": [
    {
      "field": "device_id",
      "message": "\"device_id\" is required"
    }
  ]
}
```

## 🔍 Verificar Devices Criados

### Listar todos os devices:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/devices" -Method GET
```

### Buscar device específico:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/devices/ESP32_001" -Method GET
```

## 📝 Exemplos de Devices

### Exemplo 1 - Sala de Estar
```json
{
  "device_id": "ESP32_SALA",
  "name": "ESP32 Sala de Estar",
  "location": "Sala de estar - 1º andar",
  "description": "Monitoramento de temperatura e umidade da sala principal"
}
```

### Exemplo 2 - Cozinha
```json
{
  "device_id": "ESP32_COZINHA",
  "name": "ESP32 Cozinha",
  "location": "Cozinha",
  "description": "Monitoramento da cozinha para controle de umidade"
}
```

### Exemplo 3 - Jardim
```json
{
  "device_id": "ESP32_JARDIM",
  "name": "ESP32 Jardim",
  "location": "Jardim traseiro",
  "description": "Monitoramento de umidade do solo para irrigação automática"
}
```

## 🛠️ Próximos Passos

Após criar o device:

1. **Configurar ESP32**: Atualizar o `device_id` no código do ESP32
2. **Testar conexão**: Enviar dados de teste para a API
3. **Monitorar dados**: Verificar se os dados estão sendo recebidos
4. **Configurar aplicativo**: Adicionar o device no app mobile

## 🔧 Troubleshooting

### API não responde
- Verifique se o servidor está rodando: `npm run dev`
- Confirme a porta: `http://localhost:3000`
- Teste o health check: `GET /health`

### Device não aparece na lista
- Aguarde alguns segundos para sincronização
- Verifique se não há erros no console do servidor
- Confirme se o device foi criado com sucesso (status 201)

### Erro de validação
- Verifique se todos os campos obrigatórios estão preenchidos
- Confirme se o `device_id` é único
- Verifique os limites de caracteres dos campos 