-- ============================================================
-- ÀMesa — Cofre para os uploads do formulário de registo (registo.html)
-- Correr no Supabase: SQL Editor -> colar -> Run  (podes correr outra vez sem problema)
-- ============================================================

-- 1) Cofre (bucket) público só para as fotos/PDF que os novos donos anexam no formulário.
insert into storage.buckets (id, name, public)
values ('registos', 'registos', true)
on conflict (id) do update set public = true;

-- 2) Permitir ENVIAR ficheiros para este cofre a partir do formulário (sem login).
--    Usamos "to public" (todos os papéis) porque as chaves novas do Supabase nem sempre
--    resolvem para o papel "anon" — assim o upload funciona de forma fiável, mas SÓ neste cofre.
drop policy if exists "registos anon insert"   on storage.objects;
drop policy if exists "registos public insert" on storage.objects;
create policy "registos public insert"
  on storage.objects for insert
  to public
  with check (bucket_id = 'registos');

-- (Opcional) permitir também substituir/atualizar um ficheiro deste cofre (para o x-upsert)
drop policy if exists "registos public update" on storage.objects;
create policy "registos public update"
  on storage.objects for update
  to public
  using (bucket_id = 'registos')
  with check (bucket_id = 'registos');

-- A leitura pública das imagens vem do bucket ser public=true (aparecem pelo URL).
-- Nota: como é público, qualquer pessoa pode enviar para 'registos'. Está isolado do bucket
-- 'imagens' (menus reais, com login). Limpa o cofre 'registos' de vez em quando no Supabase.


-- ============================================================
-- 3) TABELA dos formulários recebidos (o formulário grava aqui; só o admin lê)
-- ============================================================
create table if not exists public.registos (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  dados jsonb not null default '{}'::jsonb,
  tratado boolean not null default false
);
alter table public.registos enable row level security;

-- O formulário (público, sem login) pode SUBMETER
drop policy if exists "registos insert publico" on public.registos;
create policy "registos insert publico"
  on public.registos for insert to public with check (true);

-- Só ADMINISTRADORES podem ler / marcar tratado / apagar (os dados de contacto ficam privados)
drop policy if exists "registos admin select" on public.registos;
create policy "registos admin select" on public.registos for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
drop policy if exists "registos admin update" on public.registos;
create policy "registos admin update" on public.registos for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
drop policy if exists "registos admin delete" on public.registos;
create policy "registos admin delete" on public.registos for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
