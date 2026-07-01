-- ════════════════════════════════════════════════════════
-- RODE NO SQL EDITOR DO SUPABASE
-- ════════════════════════════════════════════════════════

-- 1. Adicionar coluna destinos_extras na tabela pedidos
--    (só adiciona se não existir — seguro rodar mais de uma vez)
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS destinos_extras JSONB DEFAULT NULL;


-- 2. Criar tabela de localização do motoboy
CREATE TABLE IF NOT EXISTS motoboy_localizacao (
    id            TEXT PRIMARY KEY,   -- ex: 'motoboy1'
    lat           DOUBLE PRECISION NOT NULL,
    lng           DOUBLE PRECISION NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. Policies de segurança para motoboy_localizacao
ALTER TABLE motoboy_localizacao ENABLE ROW LEVEL SECURITY;

-- Leitura pública (cliente vê a localização no rastreio)
CREATE POLICY "Leitura publica loc"
ON motoboy_localizacao FOR SELECT
USING (true);

-- Escrita permitida (motoboy salva o GPS)
CREATE POLICY "Escrita loc"
ON motoboy_localizacao FOR ALL
USING (true)
WITH CHECK (true);
