# Deploy da API no Vercel

Este guia explica como fazer o deploy da API de monitoramento IoT no Vercel.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Projeto no GitHub
- Node.js 16+ (localmente para testes)

## 🚀 Passo a Passo

### 1. Preparar o Projeto

#### 1.1 Verificar Estrutura
Certifique-se de que o projeto tem a seguinte estrutura:
```
projeto-api/
├── server.js              # ✅ Ponto de entrada
├── package.json           # ✅ Dependências
├── vercel.json           # ✅ Configuração Vercel
├── .gitignore            # ✅ Arquivos ignorados
├── database/             # ✅ Configuração DB
├── routes/               # ✅ Rotas da API
├── middleware/           # ✅ Middlewares
└── scripts/              # ✅ Scripts utilitários
```

#### 1.2 Verificar package.json
O `package.json` deve ter:
- `"main": "server.js"`
- `"start": "node server.js"`
- Todas as dependências necessárias

### 2. Deploy no Vercel

#### 2.1 Conectar com GitHub
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "New Project"
4. Selecione o repositório da API

#### 2.2 Configurar Projeto
1. **Framework Preset**: Node.js
2. **Root Directory**: `./` (ou deixe vazio)
3. **Build Command**: Deixe vazio (não é necessário)
4. **Output Directory**: Deixe vazio
5. **Install Command**: `npm install`

#### 2.3 Variáveis de Ambiente
Configure as seguintes variáveis no Vercel:

```env
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://seu-dominio.vercel.app,http://localhost:3000
DB_PATH=/tmp/monitoring.db
LOG_LEVEL=info
```

**Importante**: No Vercel, o banco SQLite será criado em `/tmp/` que é um diretório temporário.

#### 2.4 Deploy
1. Clique em "Deploy"
2. Aguarde o build e deploy
3. Anote a URL gerada (ex: `https://sua-api.vercel.app`)

### 3. Configurações Específicas

#### 3.1 Banco de Dados
O SQLite no Vercel funciona em modo temporário. Para produção, considere:
- **Planos pagos do Vercel** com armazenamento persistente
- **Banco externo** (PostgreSQL, MySQL)
- **Vercel Storage** (para dados simples)

#### 3.2 CORS
Configure `ALLOWED_ORIGINS` com os domínios dos seus apps:
```env
ALLOWED_ORIGINS=https://seu-app.vercel.app,https://seu-app-flutter.vercel.app
```

#### 3.3 Rate Limiting
O rate limiting está configurado para 1000 requisições por 15 minutos por IP.

### 4. Testando o Deploy

#### 4.1 Health Check
```bash
curl https://sua-api.vercel.app/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0"
}
```

#### 4.2 Endpoints Principais
```bash
# Rota raiz
curl https://sua-api.vercel.app/

# Listar dispositivos
curl https://sua-api.vercel.app/api/devices

# Dados dos sensores
curl https://sua-api.vercel.app/api/sensors
```

### 5. Configuração de Domínio Personalizado (Opcional)

#### 5.1 Adicionar Domínio
1. No dashboard do Vercel, vá em "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

#### 5.2 SSL/HTTPS
O Vercel fornece SSL automático para todos os domínios.

### 6. Monitoramento e Logs

#### 6.1 Logs do Vercel
- Acesse o dashboard do projeto
- Vá em "Functions" para ver logs das funções
- Use "Analytics" para métricas de performance

#### 6.2 Health Checks
Configure monitoramento externo para verificar se a API está funcionando.

### 7. Atualizações

#### 7.1 Deploy Automático
O Vercel faz deploy automático quando você faz push para a branch principal.

#### 7.2 Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 8. Troubleshooting

#### 8.1 Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Confirme que o `server.js` é o ponto de entrada correto

#### 8.2 Erro de CORS
- Verifique a configuração de `ALLOWED_ORIGINS`
- Teste com `*` temporariamente para debug

#### 8.3 Erro de Banco de Dados
- O SQLite no Vercel é temporário
- Considere migrar para um banco persistente

#### 8.4 Timeout
- Aumente `maxDuration` no `vercel.json` se necessário
- Otimize consultas ao banco de dados

### 9. Otimizações

#### 9.1 Performance
- Use índices no banco de dados
- Implemente cache quando possível
- Otimize consultas SQL

#### 9.2 Segurança
- Mantenha dependências atualizadas
- Use variáveis de ambiente para dados sensíveis
- Configure rate limiting adequado

### 10. Próximos Passos

#### 10.1 Banco de Dados Persistente
Para produção, considere:
- **Vercel Postgres** (recomendado)
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

#### 10.2 Monitoramento
- Configure alertas no Vercel
- Use ferramentas como Sentry para logs de erro
- Implemente métricas personalizadas

---

**Deploy concluído! 🚀**

Sua API está disponível em: `https://sua-api.vercel.app` 