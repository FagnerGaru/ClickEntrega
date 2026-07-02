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


-- ════════════════════════════════════════════════════════
-- CORREÇÃO DE SEGURANÇA — RODAR ANTES DE TORNAR O REPO PÚBLICO
-- Hoje qualquer pessoa (sem login) consegue ler todos os
-- pedidos (nome, telefone, endereço) e falsificar a
-- localização do motoboy. Isso corrige isso.
-- ════════════════════════════════════════════════════════

-- 1. Antes de rodar, veja quais policies já existem na tabela
--    "pedidos" (o nome pode variar dependendo de como foram
--    criadas pelo painel do Supabase):
--
--    SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'pedidos';
--
--    Apague manualmente qualquer policy que já permita
--    SELECT/UPDATE para o role "anon" antes de criar as novas abaixo,
--    ou troque os nomes no "DROP POLICY IF EXISTS" abaixo pelos nomes reais.

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura publica pedidos" ON pedidos;
DROP POLICY IF EXISTS "Enable read access for all users" ON pedidos;
DROP POLICY IF EXISTS "Escrita publica pedidos" ON pedidos;

-- Criação de pedido continua pública — o cliente faz o pedido
-- em solicitar.html sem estar logado.
CREATE POLICY "Criacao publica pedidos"
ON pedidos FOR INSERT
WITH CHECK (true);

-- Leitura completa (lista de todos os pedidos) só para quem
-- estiver logado (admin/motoboy).
CREATE POLICY "Leitura pedidos autenticado"
ON pedidos FOR SELECT
TO authenticated
USING (true);

-- Alterar status só para quem estiver logado.
CREATE POLICY "Atualizacao pedidos autenticado"
ON pedidos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Rastreamento público (rastreio.html) precisa continuar
--    funcionando sem login, mas só devolvendo os campos
--    necessários (não endereço/telefone) de UM pedido por vez,
--    filtrado pelo código de rastreio. Por isso usamos uma
--    função (RPC) em vez de liberar SELECT geral para "anon".
CREATE OR REPLACE FUNCTION obter_pedido_rastreio(p_codigo TEXT)
RETURNS TABLE (
    numero_pedido INT,
    codigo_rastreio TEXT,
    nome_coleta TEXT,
    valor_total NUMERIC,
    status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT numero_pedido, codigo_rastreio, nome_coleta, valor_total, status
    FROM pedidos
    WHERE codigo_rastreio = p_codigo;
$$;

GRANT EXECUTE ON FUNCTION obter_pedido_rastreio(TEXT) TO anon, authenticated;

-- 3. Localização do motoboy: leitura continua pública (o cliente
--    precisa ver no rastreio), mas só o motoboy logado pode
--    escrever a própria localização.
DROP POLICY IF EXISTS "Escrita loc" ON motoboy_localizacao;

CREATE POLICY "Escrita loc autenticado"
ON motoboy_localizacao FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
