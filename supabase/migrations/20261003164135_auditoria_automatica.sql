-- =========================================================
-- InmoCheck — Auditoría automática (RF-14, CA-16)
--
-- Un trigger registra cada creación o cambio en la tabla auditoria.
-- Ventaja frente a hacerlo desde la app: es imposible "olvidarse" de
-- auditar, y el usuario no necesita permiso de escritura sobre auditoria.
--
-- Argumentos del trigger:
--   1. nombre del recurso que se guarda en auditoria.recurso
--   2. 'con_datos' guarda el antes y el después; 'sin_datos' no, para no
--      copiar datos personales (propietarios, perfiles).
-- =========================================================
create function public.auditar_cambio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_accion text;
  v_con_datos boolean := coalesce(tg_argv[1], '') = 'con_datos';
begin
  if tg_op = 'INSERT' then
    v_accion := 'CREADO';
  elsif old.activo and not new.activo then
    v_accion := 'DESACTIVADO';
  elsif not old.activo and new.activo then
    v_accion := 'REACTIVADO';
  else
    v_accion := 'ACTUALIZADO';
  end if;

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion, antes, despues)
  values (
    new.organizacion_id,
    (select auth.uid()),
    tg_argv[0],
    new.id,
    v_accion,
    case when v_con_datos and tg_op = 'UPDATE' then to_jsonb(old) end,
    case when v_con_datos then to_jsonb(new) end
  );
  return new;
end;
$$;

revoke execute on function public.auditar_cambio() from public, anon, authenticated;

create trigger trg_auditar_inmuebles
  after insert or update on public.inmuebles
  for each row execute function public.auditar_cambio('INMUEBLE', 'con_datos');

create trigger trg_auditar_espacios
  after insert or update on public.espacios
  for each row execute function public.auditar_cambio('ESPACIO', 'con_datos');

create trigger trg_auditar_elementos
  after insert or update on public.elementos
  for each row execute function public.auditar_cambio('ELEMENTO', 'con_datos');

create trigger trg_auditar_personas
  after insert or update on public.personas
  for each row execute function public.auditar_cambio('PROPIETARIO', 'sin_datos');

-- En perfiles solo se auditan los cambios; la invitación la registra el servidor.
create trigger trg_auditar_perfiles
  after update on public.perfiles
  for each row execute function public.auditar_cambio('INSPECTOR', 'sin_datos');
