-- ============================================================
-- ÀMesa — FIDELIZAÇÃO 2.0  (fica DESLIGADA até o administrador a ligar em cada restaurante)
--
--  • o cartão fica no servidor, ligado ao número de telemóvel do cliente (não se perde)
--  • o cliente NÃO se carimba a si próprio: só a Gestão do restaurante dá carimbos
--      - lendo o QR pessoal do cliente, ou escrevendo o número de telemóvel
--      - automático: encomenda take-away feita na ÀMesa e marcada como "entregue"
--  • no máximo 1 carimbo por cliente por dia
--  • o prémio só é dado quando o dono o entrega na Gestão (não dá para usar duas vezes)
--  • telemóvel novo: o cartão só passa para o aparelho novo quando o restaurante confirma
--  • só funciona nos restaurantes com  config.fidelidade.v2 = true  (interruptor no editor)
--
-- Correr no Supabase: SQL Editor -> colar -> Run (pode repetir-se).
-- ============================================================

create table if not exists public.fid_cartoes (
  id             uuid primary key default gen_random_uuid(),
  negocio_id     uuid not null references public.negocios(id) on delete cascade,
  telefone       text not null,                 -- só dígitos (últimos 9)
  nome           text,
  token          text unique,                   -- o QR pessoal do aparelho do cliente
  token_pendente text,                          -- aparelho novo à espera da confirmação do restaurante
  carimbos       int  not null default 0,
  premios        int  not null default 0,
  ultimo_carimbo date,
  criado_em      timestamptz not null default now(),
  unique (negocio_id, telefone)
);
create table if not exists public.fid_movimentos (
  id         uuid primary key default gen_random_uuid(),
  cartao_id  uuid not null references public.fid_cartoes(id) on delete cascade,
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  tipo       text not null,                     -- carimbo | premio
  origem     text,                              -- qr | telefone | encomenda
  ref        text,                              -- id da encomenda (carimbo automático)
  anulado    boolean not null default false,
  criado_em  timestamptz not null default now(),
  criado_por uuid
);
create index if not exists fid_mov_neg on public.fid_movimentos (negocio_id, criado_em desc);
create unique index if not exists fid_mov_ref on public.fid_movimentos (ref) where ref is not null;

alter table public.fid_cartoes    enable row level security;
alter table public.fid_movimentos enable row level security;
drop policy if exists fid_cartoes_dono on public.fid_cartoes;
create policy fid_cartoes_dono on public.fid_cartoes for select to authenticated using (public.e_dono(negocio_id));
drop policy if exists fid_mov_dono on public.fid_movimentos;
create policy fid_mov_dono on public.fid_movimentos for select to authenticated using (public.e_dono(negocio_id));
-- (o cliente não lê as tabelas: só pelas funções abaixo)

create or replace function public._fid_tel(p text) returns text language sql immutable as $$
  select right(regexp_replace(coalesce(p,''), '\D', '', 'g'), 9)
$$;
create or replace function public._fid_hoje() returns date language sql stable as $$ select (now() at time zone 'Europe/Lisbon')::date $$;
create or replace function public._fid_cfg(p_negocio uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(config->'fidelidade', '{}'::jsonb) from public.negocios where id = p_negocio
$$;
create or replace function public._fid_ligada(p_negocio uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((public._fid_cfg(p_negocio)->>'v2')::boolean, false) and coalesce((public._fid_cfg(p_negocio)->>'ativo')::boolean, false)
$$;
create or replace function public._fid_json(c public.fid_cartoes) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', c.id, 'nome', c.nome, 'tel', '•••' || right(c.telefone, 3),
    'carimbos', c.carimbos, 'premios', c.premios,
    'total', greatest(2, coalesce((public._fid_cfg(c.negocio_id)->>'total')::int, 8)),
    'premio', coalesce(nullif(public._fid_cfg(c.negocio_id)->>'premio',''), 'Oferta da casa'),
    'hoje', (c.ultimo_carimbo = public._fid_hoje()))
$$;

-- CLIENTE: entrar com o número (cria o cartão; num aparelho novo fica à espera do restaurante)
create or replace function public.fid_entrar(p_negocio uuid, p_tel text, p_nome text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_tel text := public._fid_tel(p_tel); c public.fid_cartoes;
begin
  if not public._fid_ligada(p_negocio) then return jsonb_build_object('estado','desligada'); end if;
  if length(v_tel) < 9 or length(coalesce(p_token,'')) < 20 then return jsonb_build_object('estado','dados'); end if;
  select * into c from public.fid_cartoes where negocio_id = p_negocio and telefone = v_tel;
  if not found then
    insert into public.fid_cartoes(negocio_id, telefone, nome, token) values (p_negocio, v_tel, left(nullif(trim(p_nome),''), 60), p_token) returning * into c;
    return jsonb_build_object('estado','ok') || public._fid_json(c);
  end if;
  if c.token = p_token then return jsonb_build_object('estado','ok') || public._fid_json(c); end if;
  update public.fid_cartoes set token_pendente = p_token where id = c.id;
  return jsonb_build_object('estado','pendente');
end $$;

-- CLIENTE: ver o próprio cartão (pelo código secreto do aparelho)
create or replace function public.fid_ver(p_negocio uuid, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.fid_cartoes;
begin
  if not public._fid_ligada(p_negocio) then return jsonb_build_object('estado','desligada'); end if;
  select * into c from public.fid_cartoes where negocio_id = p_negocio and token = p_token;
  if found then return jsonb_build_object('estado','ok') || public._fid_json(c); end if;
  if exists (select 1 from public.fid_cartoes where negocio_id = p_negocio and token_pendente = p_token) then return jsonb_build_object('estado','pendente'); end if;
  return jsonb_build_object('estado','sem');
end $$;

-- RESTAURANTE: encontrar um cartão pelo QR (token) ou pelo número
create or replace function public.fid_procurar(p_negocio uuid, p_token text, p_tel text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.fid_cartoes; v_pend boolean := false;
begin
  if not public.e_dono(p_negocio) then raise exception 'sem_permissao'; end if;
  if coalesce(p_token,'') <> '' then
    select * into c from public.fid_cartoes where negocio_id = p_negocio and token = p_token;
    if not found then select * into c from public.fid_cartoes where negocio_id = p_negocio and token_pendente = p_token; v_pend := found; end if;
  else
    select * into c from public.fid_cartoes where negocio_id = p_negocio and telefone = public._fid_tel(p_tel);
  end if;
  if c.id is null then return jsonb_build_object('estado','sem'); end if;
  return jsonb_build_object('estado','ok', 'pendente', v_pend, 'telefone', c.telefone) || public._fid_json(c);
end $$;

-- RESTAURANTE: dar um carimbo (1 por dia)
create or replace function public.fid_carimbar(p_negocio uuid, p_cartao uuid, p_origem text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.fid_cartoes; v_total int;
begin
  if not public.e_dono(p_negocio) then raise exception 'sem_permissao'; end if;
  select * into c from public.fid_cartoes where id = p_cartao and negocio_id = p_negocio for update;
  if not found then return jsonb_build_object('estado','sem'); end if;
  v_total := greatest(2, coalesce((public._fid_cfg(p_negocio)->>'total')::int, 8));
  if c.ultimo_carimbo = public._fid_hoje() then return jsonb_build_object('estado','hoje') || public._fid_json(c); end if;
  if c.carimbos >= v_total then return jsonb_build_object('estado','cheio') || public._fid_json(c); end if;
  update public.fid_cartoes set carimbos = carimbos + 1, ultimo_carimbo = public._fid_hoje() where id = c.id returning * into c;
  insert into public.fid_movimentos(cartao_id, negocio_id, tipo, origem, criado_por) values (c.id, p_negocio, 'carimbo', coalesce(p_origem,'qr'), auth.uid());
  return jsonb_build_object('estado','ok') || public._fid_json(c);
end $$;

-- RESTAURANTE: entregar o prémio (desconta os carimbos do cartão cheio)
create or replace function public.fid_premio(p_negocio uuid, p_cartao uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.fid_cartoes; v_total int;
begin
  if not public.e_dono(p_negocio) then raise exception 'sem_permissao'; end if;
  select * into c from public.fid_cartoes where id = p_cartao and negocio_id = p_negocio for update;
  if not found then return jsonb_build_object('estado','sem'); end if;
  v_total := greatest(2, coalesce((public._fid_cfg(p_negocio)->>'total')::int, 8));
  if c.carimbos < v_total then return jsonb_build_object('estado','incompleto') || public._fid_json(c); end if;
  update public.fid_cartoes set carimbos = carimbos - v_total, premios = premios + 1 where id = c.id returning * into c;
  insert into public.fid_movimentos(cartao_id, negocio_id, tipo, origem, criado_por) values (c.id, p_negocio, 'premio', 'gestao', auth.uid());
  return jsonb_build_object('estado','ok') || public._fid_json(c);
end $$;

-- RESTAURANTE: passar o cartão para o telemóvel novo do cliente
create or replace function public.fid_ligar(p_negocio uuid, p_cartao uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.fid_cartoes;
begin
  if not public.e_dono(p_negocio) then raise exception 'sem_permissao'; end if;
  update public.fid_cartoes set token = token_pendente, token_pendente = null
   where id = p_cartao and negocio_id = p_negocio and token_pendente is not null returning * into c;
  if not found then return jsonb_build_object('estado','sem'); end if;
  return jsonb_build_object('estado','ok') || public._fid_json(c);
end $$;

-- RESTAURANTE: anular um carimbo (engano ou suspeita)
create or replace function public.fid_anular(p_negocio uuid, p_mov uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.fid_movimentos;
begin
  if not public.e_dono(p_negocio) then raise exception 'sem_permissao'; end if;
  select * into m from public.fid_movimentos where id = p_mov and negocio_id = p_negocio and not anulado and tipo = 'carimbo';
  if not found then return jsonb_build_object('estado','sem'); end if;
  update public.fid_movimentos set anulado = true where id = m.id;
  update public.fid_cartoes set carimbos = greatest(0, carimbos - 1),
         ultimo_carimbo = case when m.criado_em::date = public._fid_hoje() then null else ultimo_carimbo end
   where id = m.cartao_id;
  return jsonb_build_object('estado','ok');
end $$;

grant execute on function public.fid_entrar(uuid, text, text, text) to anon, authenticated;
grant execute on function public.fid_ver(uuid, text) to anon, authenticated;
grant execute on function public.fid_procurar(uuid, text, text) to authenticated;
grant execute on function public.fid_carimbar(uuid, uuid, text) to authenticated;
grant execute on function public.fid_premio(uuid, uuid) to authenticated;
grant execute on function public.fid_ligar(uuid, uuid) to authenticated;
grant execute on function public.fid_anular(uuid, uuid) to authenticated;
revoke execute on function public._fid_json(public.fid_cartoes) from public, anon;

-- CARIMBO AUTOMÁTICO: encomenda take-away marcada como "entregue" (se o cliente já tiver cartão com esse número)
create or replace function public._fid_encomenda_entregue() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.fid_cartoes; v_total int;
begin
  if new.estado = 'entregue' and coalesce(old.estado,'') <> 'entregue' and public._fid_ligada(new.negocio_id) and public._fid_tel(new.telefone) <> '' then
    select * into c from public.fid_cartoes where negocio_id = new.negocio_id and telefone = public._fid_tel(new.telefone) for update;
    if found and coalesce(c.ultimo_carimbo, date '1900-01-01') <> public._fid_hoje() then
      v_total := greatest(2, coalesce((public._fid_cfg(new.negocio_id)->>'total')::int, 8));
      if c.carimbos < v_total then
        begin
          insert into public.fid_movimentos(cartao_id, negocio_id, tipo, origem, ref) values (c.id, new.negocio_id, 'carimbo', 'encomenda', 'enc:' || new.id);
          update public.fid_cartoes set carimbos = carimbos + 1, ultimo_carimbo = public._fid_hoje() where id = c.id;
        exception when unique_violation then null;   -- esta encomenda já deu carimbo
        end;
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists fid_encomenda_entregue on public.encomendas;
create trigger fid_encomenda_entregue after update of estado on public.encomendas
  for each row execute function public._fid_encomenda_entregue();

-- Confirmação
select 'ok' as fidelidade_v2,
       (select count(*) from public.negocios where coalesce((config->'fidelidade'->>'v2')::boolean,false)) as restaurantes_com_v2_ligada;
