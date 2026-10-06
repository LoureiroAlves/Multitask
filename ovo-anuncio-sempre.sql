-- ============================================================
-- ÀMesa — "NO CU DA GALINHA": aviso SEMPRE que uma sessão é publicada
--
--  • antes: o anúncio só saía se faltassem mais de 20 minutos
--  • agora: sai sempre (na véspera, 1 hora antes ou 3 minutos antes),
--    enquanto as inscrições estiverem abertas (até 1 minuto antes do início)
--  • a menos de 15 min, o anúncio substitui o lembrete dos 15 min (nunca chegam dois seguidos)
--  • ovo_avisos_agora(): o Painel chama-a logo a seguir a publicar → o aviso sai na hora,
--    sem esperar pelo minuto seguinte (só o administrador pode chamar)
--  • 1 minuto antes e no início: igual (só os inscritos)
--
-- Correr no Supabase: SQL Editor -> colar -> Run (pode repetir-se).
-- Correr DEPOIS do ovo-inscricoes.sql (substitui a função dos avisos).
-- ============================================================

-- ---------- AVISOS AUTOMÁTICOS (a cada minuto) ----------
create or replace function public.ovo_avisos_cron() returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_seg text; v_url text := 'https://zewiijcrkyxjkhudlplk.supabase.co/functions/v1/enviar-push';
  j record; n int := 0; v_quando text; v_dia date; v_hoje date; v_eps jsonb; v_fecho text;
begin
  select valor into v_seg from public._cron_cfg where chave = 'cron_secret';
  if v_seg is null then return 0; end if;

  -- 1) anúncio ao publicar: SEMPRE (para todos), desde que as inscrições ainda estejam abertas
  --    (até 1 minuto antes do início). Se já faltar pouco, o texto diz a hora a que fecham as inscrições.
  for j in select g.id, g.negocio_id, g.premio_nome, g.inicio, ng.nome as neg_nome, ng.slug
             from public.ovo_jogos g join public.negocios ng on ng.id = g.negocio_id
            where g.estado = 'publicado' and g.avisar_push and g.aviso_anuncio_em is null
              and now() < g.inicio - interval '1 minute'
              for update of g skip locked   -- se o Painel e o relógio correrem ao mesmo tempo, só um envia
  loop
    -- se já estamos a menos de 15 min, este anúncio substitui o lembrete dos 15 min (não chegam dois avisos seguidos)
    update public.ovo_jogos set aviso_anuncio_em = now(),
           aviso_antes_em = case when now() >= inicio - interval '15 minutes' then now() else aviso_antes_em end
     where id = j.id;
    v_fecho := to_char((j.inicio - interval '1 minute') at time zone 'Europe/Lisbon', 'HH24:MI');
    v_dia  := (j.inicio at time zone 'Europe/Lisbon')::date;
    v_hoje := (now() at time zone 'Europe/Lisbon')::date;
    v_quando := case
      when v_dia = v_hoje     then 'hoje'
      when v_dia = v_hoje + 1 then 'amanhã'
      else (array['domingo','segunda','terça','quarta','quinta','sexta','sábado'])[extract(dow from v_dia)::int + 1]
           || ', ' || to_char(v_dia, 'DD/MM')
    end || ' às ' || to_char(j.inicio at time zone 'Europe/Lisbon', 'HH24:MI');
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','x-amesa-cron', v_seg),
      body := jsonb_build_object('negocio', j.negocio_id,
                                 'titulo', '🥚 Vem aí uma caça ao ovo no ' || coalesce(j.neg_nome,'') || '!',
                                 'corpo', case when now() >= j.inicio - interval '20 minutes'
                                   then 'Começa já às ' || to_char(j.inicio at time zone 'Europe/Lisbon', 'HH24:MI') || '! Prémio: ' || coalesce(j.premio_nome,'') || '. Inscreve-te no menu até às ' || v_fecho || ' — só os inscritos jogam.'
                                   else 'Começa ' || v_quando || '. Prémio: ' || coalesce(j.premio_nome,'') || '. Inscreve-te no menu — só os inscritos jogam.' end,
                                 'url', 'https://amesadigital.pt/cardapio.html?n=' || j.slug));
    n := n + 1;
  end loop;

  -- 2) 15 minutos antes (para todos: última chamada para se inscreverem)
  for j in select g.id, g.negocio_id, g.premio_nome, g.inicio, ng.nome as neg_nome, ng.slug
             from public.ovo_jogos g join public.negocios ng on ng.id = g.negocio_id
            where g.estado = 'publicado' and g.avisar_push and g.aviso_antes_em is null
              and now() >= g.inicio - interval '15 minutes' and now() < g.inicio - interval '2 minutes'
  loop
    update public.ovo_jogos set aviso_antes_em = now() where id = j.id;
    v_fecho := to_char((j.inicio - interval '1 minute') at time zone 'Europe/Lisbon', 'HH24:MI');
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','x-amesa-cron', v_seg),
      body := jsonb_build_object('negocio', j.negocio_id,
                                 'titulo', '🥚 Daqui a pouco: caça ao ovo!',
                                 'corpo', coalesce(j.neg_nome,'') || ' — começa às ' || to_char(j.inicio at time zone 'Europe/Lisbon', 'HH24:MI') || '. Prémio: ' || coalesce(j.premio_nome,'') || '. Inscrições até às ' || v_fecho || '.',
                                 'url', 'https://amesadigital.pt/cardapio.html?n=' || j.slug));
    n := n + 1;
  end loop;

  -- 3) 1 minuto antes: SÓ os inscritos (abre o menu já pronto para a caça)
  for j in select g.id, g.negocio_id, g.premio_nome, g.inicio, ng.nome as neg_nome, ng.slug
             from public.ovo_jogos g join public.negocios ng on ng.id = g.negocio_id
            where g.estado = 'publicado' and g.aviso_1min_em is null
              and now() >= g.inicio - interval '1 minute' and now() < g.inicio
  loop
    update public.ovo_jogos set aviso_1min_em = now() where id = j.id;
    select jsonb_agg(distinct p.push_endpoint) into v_eps
      from public.ovo_participacoes p where p.jogo_id = j.id and p.push_endpoint is not null;
    if v_eps is not null and jsonb_array_length(v_eps) > 0 then   -- lista vazia = NÃO enviar (sem lista, a função mandava a todos)
      perform net.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type','application/json','x-amesa-cron', v_seg),
        body := jsonb_build_object('negocio', j.negocio_id, 'endpoints', v_eps, 'fixa', true, 'tag', 'ovo-' || j.id,
                                   'titulo', '🥚 Prepara-te! Começa daqui a 1 minuto',
                                   'corpo', 'Abre o menu do ' || coalesce(j.neg_nome,'') || ' — quando começar entras logo na caça. Prémio: ' || coalesce(j.premio_nome,'') || '.',
                                   'url', 'https://amesadigital.pt/cardapio.html?n=' || j.slug));
      n := n + 1;
    end if;
  end loop;

  -- 4) à hora de início: SÓ os inscritos (até 10 min de atraso)
  for j in select g.id, g.negocio_id, g.premio_nome, ng.nome as neg_nome, ng.slug
             from public.ovo_jogos g join public.negocios ng on ng.id = g.negocio_id
            where g.estado = 'publicado' and g.avisar_push and g.aviso_inicio_em is null
              and now() >= g.inicio and now() < least(g.fim, g.inicio + interval '10 minutes')
  loop
    update public.ovo_jogos set aviso_inicio_em = now() where id = j.id;
    select jsonb_agg(distinct p.push_endpoint) into v_eps
      from public.ovo_participacoes p where p.jogo_id = j.id and p.push_endpoint is not null;
    if v_eps is not null and jsonb_array_length(v_eps) > 0 then
      perform net.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type','application/json','x-amesa-cron', v_seg),
        body := jsonb_build_object('negocio', j.negocio_id, 'endpoints', v_eps, 'tag', 'ovo-' || j.id,
                                   'titulo', '🥚 A caça ao ovo começou!',
                                   'corpo', coalesce(j.neg_nome,'') || ': o ovo já está escondido no menu. Prémio: ' || coalesce(j.premio_nome,'') || '. Sê o primeiro!',
                                   'url', 'https://amesadigital.pt/cardapio.html?n=' || j.slug));
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke all on function public.ovo_avisos_cron() from public, anon, authenticated;

-- ---------- enviar já (chamado pelo Painel depois de publicar) ----------
create or replace function public.ovo_avisos_agora() returns int
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'so_admin'; end if;
  return public.ovo_avisos_cron();
end $$;
revoke all on function public.ovo_avisos_agora() from public, anon;
grant execute on function public.ovo_avisos_agora() to authenticated;

-- Confirmação
select 'ok' as anuncio_sempre;
