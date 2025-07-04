# Migração para PostgreSQL

Este guia explica como migrar o projeto da API do SQLite para PostgreSQL.

## 🎯 Por que PostgreSQL?

### Vantagens do PostgreSQL
- ✅ **Persistência**: Dados não são perdidos entre deploys
- ✅ **Performance**: Melhor performance para consultas complexas
- ✅ **Escalabilidade**: Suporte a grandes volumes de dados
- ✅ **Recursos Avançados**: Triggers, stored procedures, JSON
- ✅ **Concorrência**: Melhor controle de transações
- ✅ **Backup**: Ferramentas robustas de backup

### Comparação SQLite vs PostgreSQL

| Aspecto | SQLite | PostgreSQL |
|---------|--------|------------|
| **Persistência** | Temporário no Vercel | Persistente |
| **Performance** | Limitada | Alta |
| **Concorrência** | Básica | Avançada |
| **Escalabilidade** | Limitada | Alta |
| **Backup** | Manual | Automático |
| **Deploy** | Simples | Requer configuração |

## 🚀 Passo a Passo da Migração

### 1. Configurar PostgreSQL

#### 1.1 Local (Desenvolvimento)
```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Criar banco de dados
createdb monitoring_db

# Ou via psql
psql -U postgres
CREATE DATABASE monitoring_db;
\q
```

#### 1.2 Vercel (Produção)
1. Acesse o dashboard do Vercel
2. Vá em "Storage" > "Create Database"
3. Selecione "Postgres"
4. Configure o plano (Hobby é gratuito)
5. Anote as credenciais

### 2. Configurar Variáveis de Ambiente

#### 2.1 Local (.env)
```env
# Configurações do PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=monitoring_db
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
```

#### 2.2 Vercel (Produção)
```env
# Configurações do PostgreSQL
DB_HOST=db.vercel-storage.com
DB_PORT=5432
DB_NAME=verceldb
DB_USER=default
DB_PASSWORD=sua_senha_do_vercel
```

### 3. Instalar Dependências

```bash
# Instalar pg (PostgreSQL client)
npm install pg

# Remover sqlite3 (opcional)
npm uninstall sqlite3
```

### 4. Migrar Dados (Se necessário)

Se você já tem dados no SQLite:

```bash
# Executar script de migração
npm run migrate-to-postgres
```

### 5. Testar a Migração

```bash
# Iniciar servidor
npm start

# Testar endpoints
npm run test-deploy
```

## 📊 Estrutura do Banco PostgreSQL

### Tabelas Criadas

#### 1. devices
```sql
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. sensor_data
```sql
CREATE TABLE sensor_data (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  temperatura DECIMAL(5,2),
  umidade_solo INTEGER,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
);
```

#### 3. pump_data
```sql
CREATE TABLE pump_data (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive')),
  duration_seconds INTEGER DEFAULT 0,
  reason TEXT,
  triggered_by VARCHAR(50) CHECK (triggered_by IN ('manual', 'automatic', 'schedule')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
);
```

#### 4. pump_history
```sql
CREATE TABLE pump_history (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('activated', 'deactivated')),
  duration_seconds INTEGER DEFAULT 0,
  reason TEXT,
  triggered_by VARCHAR(50) CHECK (triggered_by IN ('manual', 'automatic', 'schedule')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
);
```

### Índices e Triggers

#### Índices para Performance
```sql
CREATE INDEX idx_device_id ON sensor_data (device_id);
CREATE INDEX idx_timestamp ON sensor_data (timestamp);
CREATE INDEX idx_created_at ON sensor_data (created_at);
CREATE INDEX idx_pump_device_id ON pump_data (device_id);
CREATE INDEX idx_pump_history_device_id ON pump_history (device_id);
CREATE INDEX idx_pump_history_created_at ON pump_history (created_at);
```

#### Triggers para updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devices_updated_at
BEFORE UPDATE ON devices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pump_data_updated_at
BEFORE UPDATE ON pump_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## 🔧 Configuração no Vercel

### 1. Criar Banco PostgreSQL
1. Dashboard Vercel > Storage > Create Database
2. Selecione "Postgres"
3. Escolha o plano (Hobby = gratuito)
4. Anote as credenciais

### 2. Configurar Variáveis
```env
DB_HOST=db.vercel-storage.com
DB_PORT=5432
DB_NAME=verceldb
DB_USER=default
DB_PASSWORD=sua_senha_aqui
NODE_ENV=production
```

### 3. Deploy
```bash
vercel --prod
```

## 🧪 Testando a Migração

### 1. Teste Local
```bash
# Configurar .env
cp env.example .env
# Editar .env com credenciais PostgreSQL

# Iniciar servidor
npm start

# Testar endpoints
curl http://localhost:3000/health
```

### 2. Teste de Produção
```bash
# Configurar URL da API
export API_URL=https://sua-api.vercel.app

# Executar testes
npm run test-deploy
```

### 3. Verificar Dados
```sql
-- Conectar ao PostgreSQL
psql -h db.vercel-storage.com -U default -d verceldb

-- Verificar tabelas
\dt

-- Verificar dados
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM sensor_data;
SELECT COUNT(*) FROM pump_history;
```

## 📈 Monitoramento

### 1. Logs do Vercel
- Dashboard > Functions > Logs
- Verificar erros de conexão
- Monitorar performance

### 2. Métricas do PostgreSQL
```sql
-- Estatísticas do banco
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables;
```

### 3. Performance
```sql
-- Consultas lentas
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🔄 Backup e Restore

### 1. Backup Automático (Vercel)
- Vercel Postgres tem backup automático
- Configurar retenção de backups
- Testar restore periodicamente

### 2. Backup Manual
```bash
# Backup
pg_dump -h db.vercel-storage.com -U default -d verceldb > backup.sql

# Restore
psql -h db.vercel-storage.com -U default -d verceldb < backup.sql
```

## ⚠️ Troubleshooting

### 1. Erro de Conexão
```bash
# Verificar variáveis de ambiente
echo $DB_HOST
echo $DB_USER

# Testar conexão
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### 2. Erro de SSL
```javascript
// No database.js
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
```

### 3. Timeout de Conexão
```javascript
// Aumentar timeout
connectionTimeoutMillis: 5000,
idleTimeoutMillis: 30000,
```

### 4. Pool de Conexões
```javascript
// Configurar pool
max: 20,
min: 2,
```

## 🎯 Próximos Passos

### 1. Otimizações
- [ ] Configurar connection pooling
- [ ] Implementar cache (Redis)
- [ ] Otimizar consultas
- [ ] Configurar índices adicionais

### 2. Monitoramento
- [ ] Configurar alertas
- [ ] Implementar métricas
- [ ] Configurar logs estruturados
- [ ] Monitorar performance

### 3. Segurança
- [ ] Configurar SSL
- [ ] Implementar autenticação
- [ ] Configurar backup
- [ ] Auditar acessos

---

**Migração para PostgreSQL concluída! 🚀**

Agora sua API tem um banco de dados robusto e persistente! 