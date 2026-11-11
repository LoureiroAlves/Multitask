-- ============================================================
-- Multitask — AVISO AO DONO QUANDO O CLIENTE CANCELA (restaurantes)
-- Correr no Supabase: SQL Editor -> colar -> Run (pode repetir-se sem problema).
-- Requer: reservas-respostas.sql (já corrido) — usa _reserva_avisar_dono, _reserva_quando e _reserva_link_gestao.
--
-- Quando uma reserva de restaurante passa a "cancelada" por ação do CLIENTE (página pública),
-- o dono recebe "🚫 Reserva cancelada pelo cliente". Nada mais muda:
--  • cancelamentos feitos pelo próprio restaurante na Gestão → sem aviso (já sabe);
--  • tarefas automáticas do servidor → sem aviso;
--  • salões → já avisam pela sua própria função (marcacao_cancelar), por isso aqui ficam de fora.
-- ============================================================

create or replace function public._reserva_cancelada_aviso() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.servico is not null then return new; end if;                                   -- salões: avisam por marcacao_cancelar
  if coalesce(old.estado,'') = 'cancelada' or coalesce(new.estado,'') <> 'cancelada' then return new; end if;
  if coalesce(auth.role(),'') <> 'anon' then return new; end if;                        -- só quando é o cliente a cancelar
  perform public._reserva_avisar_dono(new.negocio_id,
    '🚫 Reserva cancelada pelo cliente',
    public._reserva_quando(new.data, new.hora) || ' · ' || coalesce(new.pessoas,1) || ' pessoa(s) · ' || coalesce(new.nome,''),
    public._reserva_link_gestao(new.negocio_id, new.data, new.id), 'res-' || new.id);
  return new;
exception when others then
  return new;                                                                            -- um aviso que falhe nunca impede o cancelamento
end $$;

drop trigger if exists reserva_cancelada_aviso on public.reservas;
create trigger reserva_cancelada_aviso after update of estado on public.reservas
  for each row execute function public._reserva_cancelada_aviso();

-- Confirmação: deve aparecer "aviso de cancelamento ok"
select 'aviso de cancelamento ok' as resultado;
