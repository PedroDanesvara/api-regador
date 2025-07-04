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

## Instalação

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
- `GET /api/sensors` - Listar sensores
- `POST /api/sensors` - Criar sensor
- `GET /api/sensors/:id` - Obter sensor específico
- `PUT /api/sensors/:id` - Atualizar sensor
- `DELETE /api/sensors/:id` - Remover sensor

### Bombas
- `GET /api/pumps` - Listar bombas
- `POST /api/pumps` - Criar bomba
- `GET /api/pumps/:id` - Obter bomba específica
- `PUT /api/pumps/:id` - Atualizar bomba
- `DELETE /api/pumps/:id` - Remover bomba

## Scripts Disponíveis

- `npm start` - Inicia o servidor
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `node scripts/create-device.js` - Cria um dispositivo de teste
- `node scripts/test-pump.js` - Testa a funcionalidade da bomba

## Estrutura do Projeto
```
api/
├── database/          # Configuração do banco de dados
├── middleware/        # Middlewares personalizados
├── routes/           # Rotas da API
├── scripts/          # Scripts utilitários
├── data/             # Dados do banco SQLite
└── server.js         # Arquivo principal do servidor
```

## Documentação Adicional
- `CRIAR_DEVICE.md` - Guia para criação de dispositivos
- `GUIA_DADOS_BOMBA.md` - Documentação sobre dados da bomba
- `TESTE_API.md` - Guia de testes da API 