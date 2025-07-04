# API - Sistema de Monitoramento IoT

## Descrição
API REST para gerenciamento de dispositivos IoT, sensores e bombas de água. Desenvolvida em Node.js com Express e SQLite.

## Funcionalidades
- Gerenciamento de dispositivos IoT
- Monitoramento de sensores (temperatura, umidade)
- Controle de bombas de água
- Armazenamento de dados em SQLite
- API RESTful completa

## Tecnologias
- Node.js
- Express.js
- SQLite3
- Moment.js
- Nodemon (desenvolvimento)

## 🚀 Deploy Rápido

### Vercel (Recomendado)
```bash
# 1. Clone o repositório
git clone [url-do-repositorio]

# 2. Instale o Vercel CLI
npm i -g vercel

# 3. Deploy
vercel --prod
```

**Ou use o botão abaixo:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/sua-api)

### Configuração no Vercel
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente:
   ```env
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGINS=https://seu-dominio.vercel.app
   DB_PATH=/tmp/monitoring.db
   ```
3. Deploy automático!

📖 **Guia completo**: [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)

## Instalação Local

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp env.example .env
```

4. Inicialize o banco de dados:
```bash
node scripts/init-database.js
```

5. Execute o servidor:
```bash
npm start
```

## Endpoints

### Dispositivos
- `GET /api/devices` - Listar dispositivos
- `POST /api/devices` - Criar dispositivo
- `GET /api/devices/:id` - Obter dispositivo específico
- `PUT /api/devices/:id` - Atualizar dispositivo
- `DELETE /api/devices/:id` - Remover dispositivo

### Sensores
- `GET /api/sensors` - Listar dados dos sensores
- `POST /api/sensors` - Enviar dados do sensor
- `GET /api/sensors/latest` - Últimos dados dos sensores
- `GET /api/sensors/history` - Histórico de dados

### Bombas
- `GET /api/pump/status` - Status da bomba
- `POST /api/pump/activate` - Ativar bomba
- `POST /api/pump/deactivate` - Desativar bomba
- `GET /api/pump/history` - Histórico da bomba

### Utilitários
- `GET /health` - Health check
- `GET /` - Informações da API

## Scripts Disponíveis

- `npm start` - Inicia o servidor
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run init-db` - Inicializa o banco de dados
- `npm run create-device` - Cria um dispositivo de teste
- `npm run test-pump` - Testa a funcionalidade da bomba

## Estrutura do Projeto
```
projeto-api/
├── database/          # Configuração do banco de dados
├── middleware/        # Middlewares personalizados
├── routes/           # Rotas da API
├── scripts/          # Scripts utilitários
├── data/             # Dados do banco SQLite
├── server.js         # Arquivo principal do servidor
├── vercel.json       # Configuração do Vercel
└── package.json      # Dependências do projeto
```

## Testando a API

### Health Check
```bash
curl https://sua-api.vercel.app/health
```

### Criar Dispositivo
```bash
curl -X POST https://sua-api.vercel.app/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_001",
    "name": "Sensor Principal",
    "location": "Jardim"
  }'
```

### Enviar Dados do Sensor
```bash
curl -X POST https://sua-api.vercel.app/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_001",
    "temperatura": 25.5,
    "umidade_solo": 60,
    "timestamp": 1640995200000
  }'
```

## Documentação Adicional
- `CRIAR_DEVICE.md` - Guia para criação de dispositivos
- `GUIA_DADOS_BOMBA.md` - Documentação sobre dados da bomba
- `TESTE_API.md` - Guia de testes da API
- `DEPLOY_VERCEL.md` - Guia completo de deploy no Vercel

## ⚠️ Importante sobre o Banco de Dados

No Vercel, o SQLite funciona em modo temporário (`/tmp/`). Para produção, considere:
- **Vercel Postgres** (recomendado)
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request 