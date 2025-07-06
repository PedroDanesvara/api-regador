-- Script para remover a coluna temperatura da tabela sensor_data
-- Execute este script no PostgreSQL para remover a coluna temperatura

-- Verificar se a coluna existe antes de tentar removê-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sensor_data' 
        AND column_name = 'temperatura'
    ) THEN
        ALTER TABLE sensor_data DROP COLUMN temperatura;
        RAISE NOTICE 'Coluna temperatura removida com sucesso';
    ELSE
        RAISE NOTICE 'Coluna temperatura não existe na tabela sensor_data';
    END IF;
END $$;

-- Verificar a estrutura da tabela após a remoção
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sensor_data' 
ORDER BY ordinal_position; 