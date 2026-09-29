-- ============================================================
-- ÀMesa — Fechar o cofre 'registos' (correção de segurança)
-- Correr no Supabase: SQL Editor -> colar -> Run  (podes correr outra vez sem problema)
--
-- O QUE ISTO CORRIGE
-- O migracao-registos.sql abriu o cofre 'registos' a "to public" para o formulário
-- de inscrição poder enviar fotos sem login. Ficaram dois buracos:
--
--   1) INSERT sem limites — qualquer pessoa na internet pode enviar ficheiros de
--      qualquer tipo e qualquer tamanho para o teu Storage. Como o cofre é público,
--      o conteúdo fica servido a partir do teu domínio Supabase.
--   2) UPDATE público — qualquer pessoa pode SOBRESCREVER ficheiros que já lá estão,
--      incluindo as fotos de inscrições que ainda não trataste.
--
-- O ponto 2 é o mais grave e não é usado por nada: o registo.html envia sempre para
-- um caminho novo (Date.now() + aleatório) e nunca manda o cabeçalho x-upsert.
-- ============================================================


-- ------------------------------------------------------------
-- 1) Limites no próprio cofre: tamanho e tipos de ficheiro
--    Isto é aplicado pelo Storage antes de qualquer política.
--    O formulário comprime imagens para 1600px/JPEG, por isso 10MB é folgado;
--    serve sobretudo para PDFs de ementas.
-- ------------------------------------------------------------
update storage.buckets
set file_size_limit   = 10485760,   -- 10 MB
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf'
    ]
where id = 'registos';


-- ------------------------------------------------------------
-- 2) Remover o UPDATE público  <<< a correção importante
--    Sem isto, qualquer pessoa pode substituir ficheiros do cofre.
--    Nada na app precisa desta política.
-- ------------------------------------------------------------
drop policy if exists "registos public update" on storage.objects;
drop policy if exists "registos anon update"   on storage.objects;


-- ------------------------------------------------------------
-- 3) INSERT continua público (o formulário não tem login), mas só neste cofre.
--    Recriada tal como estava — os limites do ponto 1 é que a passam a travar.
-- ------------------------------------------------------------
drop policy if exists "registos anon insert"   on storage.objects;
drop policy if exists "registos public insert" on storage.objects;
create policy "registos public insert"
  on storage.objects for insert
  to public
  with check (bucket_id = 'registos');


-- ------------------------------------------------------------
-- 4) Ninguém de fora apaga ficheiros deste cofre.
--    (Se alguma vez existiu uma política de DELETE pública, sai aqui.)
--    A limpeza do cofre faz-se no painel do Supabase, com a tua conta.
-- ------------------------------------------------------------
drop policy if exists "registos public delete" on storage.objects;
drop policy if exists "registos anon delete"   on storage.objects;


-- ------------------------------------------------------------
-- 5) Tabela public.registos — travar submissões vazias ou gigantes
--    O formulário gravava com "with check (true)": sem limite nenhum.
--    Continua sem login (tem de continuar), mas passa a exigir que o
--    'dados' seja um objeto com pelo menos o nome, e que não seja enorme.
-- ------------------------------------------------------------
drop policy if exists "registos insert publico" on public.registos;
create policy "registos insert publico"
  on public.registos for insert
  to public
  with check (
    jsonb_typeof(dados) = 'object'
    and coalesce(length(dados->>'nome'), 0) between 1 and 200
    and pg_column_size(dados) < 65536          -- 64 KB: o formulário guarda texto e URLs, não ficheiros
  );

-- As políticas de leitura/atualização/remoção (só admins) ficam como estão —
-- foram criadas no migracao-registos.sql e não são tocadas aqui.


-- ------------------------------------------------------------
-- 6) CONFERIR — corre isto depois e vê o resultado
-- ------------------------------------------------------------
-- Limites do cofre (deve mostrar 10485760 e a lista de tipos):
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'registos';

-- Políticas que sobraram no Storage para este cofre
-- (deve aparecer só o INSERT público; nenhum UPDATE nem DELETE):
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname ilike '%registos%'
order by policyname;
