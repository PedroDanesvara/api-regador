#!/bin/bash

echo "🚀 Iniciando deploy da API..."

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Fazer login no Vercel (se necessário)
echo "🔐 Verificando login no Vercel..."
vercel whoami || vercel login

# Deploy
echo "🚀 Fazendo deploy..."
vercel --prod

echo "✅ Deploy concluído!"
echo "🌐 Sua API está disponível na URL mostrada acima" 