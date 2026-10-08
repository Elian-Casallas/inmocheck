-- =========================================================
-- InmoCheck — Plazo para iniciar una inspección
--
-- El inspector puede iniciar antes o después de la hora programada, pero
-- solo hasta el cierre de oficina (7:00 p. m., hora de Colombia) del día
-- programado. Si la visita se programó después de las 7, el plazo va hasta
-- terminar ese día.
--
-- Pasado el plazo la inspección sigue en estado PENDIENTE (no se inventa un
-- estado nuevo), pero ya no se puede iniciar: el administrador debe
-- reprogramarla, reasignarla o cancelarla. La pantalla la muestra en rojo
-- como "No realizada" usando esta misma regla (lib/inspecciones.ts).
-- =========================================================
create function public.limite_para_iniciar(p_programada_para timestamptz)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case
    when (p_programada_para at time zone 'America/Bogota')
         < date_trunc('day', p_programada_para at time zone 'America/Bogota') + interval '19 hours'
      then (date_trunc('day', p_programada_para at time zone 'America/Bogota') + interval '19 hours')
           at time zone 'America/Bogota'
    else (date_trunc('day', p_programada_para at time zone 'America/Bogota') + interval '1 day')
         at time zone 'America/Bogota'
  end;
$$;

revoke execute on function public.limite_para_iniciar(timestamptz) from public, anon;
grant execute on function public.limite_para_iniciar(timestamptz) to authenticated;

-- Misma función de antes, con una validación nueva: el plazo.
create or replace function public.iniciar_inspeccion(p_id uuid, p_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.inspecciones;
begin
  select * into v from public.inspecciones
  where id = p_id and organizacion_id = public.mi_organizacion()
  for update;

  if not found or v.inspector_id <> (select auth.uid()) then
    raise exception 'NO_ENCONTRADA';
  end if;
  if v.estado <> 'PENDIENTE' then raise exception 'TRANSICION_INVALIDA'; end if;
  if v.version <> p_version then raise exception 'VERSION_CONFLICT'; end if;
  if now() > public.limite_para_iniciar(v.programada_para) then
    raise exception 'INSPECCION_VENCIDA';
  end if;

  update public.inspecciones
  set estado = 'EN_PROCESO', iniciada_en = now(), version = version + 1
  where id = p_id;

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion)
  values (v.organizacion_id, (select auth.uid()), 'INSPECCION', p_id, 'INICIADA');
end;
$$;
