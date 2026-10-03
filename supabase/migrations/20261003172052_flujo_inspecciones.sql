-- =========================================================
-- InmoCheck — Flujo de inspecciones (pasos B5.1 a B5.3)
--
-- Todo cambio sobre una inspección ocurre dentro de una función. Una
-- función SQL es UNA transacción: o se hacen todos sus pasos o ninguno.
-- Por eso no puede quedar una inspección sin detalles, ni finalizada sin
-- auditoría, aunque se caiga la red a la mitad.
--
-- Patrón que se repite en cada función:
--   1. Quién llama: auth.uid() + su organización y rol (nunca parámetros).
--   2. SELECT ... FOR UPDATE: bloquea la fila para que dos peticiones
--      simultáneas no la cambien a la vez.
--   3. Validar estado y versión (concurrencia optimista).
--   4. Escribir, subir la versión y registrar en auditoría.
--
-- Los errores se lanzan con un código en mayúsculas (VERSION_CONFLICT…)
-- que la API traduce a su respuesta HTTP.
-- =========================================================

-- ---------- B5.1 Crear inspección + snapshot del inventario ----------
create function public.crear_inspeccion(
  p_inmueble_id     uuid,
  p_inspector_id    uuid,
  p_tipo            public.inspeccion_tipo,
  p_programada_para timestamptz,
  p_nota            text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org   uuid := public.mi_organizacion();
  v_id    uuid;
  v_total integer;
begin
  if not public.es_admin() then
    raise exception 'SIN_PERMISO';
  end if;

  perform 1 from public.inmuebles
  where id = p_inmueble_id and organizacion_id = v_org and activo;
  if not found then
    raise exception 'INMUEBLE_NO_DISPONIBLE';
  end if;

  perform 1 from public.perfiles
  where id = p_inspector_id and organizacion_id = v_org and rol = 'INSPECTOR' and activo;
  if not found then
    raise exception 'INSPECTOR_NO_DISPONIBLE';
  end if;

  insert into public.inspecciones
    (organizacion_id, inmueble_id, inspector_id, tipo, programada_para, nota, creada_por)
  values
    (v_org, p_inmueble_id, p_inspector_id, p_tipo, p_programada_para,
     nullif(trim(p_nota), ''), (select auth.uid()))
  returning id into v_id;

  -- Snapshot: copia del inventario vigente. Desde aquí la inspección no
  -- depende de cómo cambie el inventario del inmueble.
  insert into public.detalles_inspeccion
    (organizacion_id, inspeccion_id, elemento_id, espacio_nombre_snapshot,
     elemento_nombre_snapshot, obligatorio_snapshot, espacio_orden_snapshot, elemento_orden_snapshot)
  select v_org, v_id, el.id, es.nombre, el.nombre, el.obligatorio, es.orden, el.orden
  from public.elementos el
  join public.espacios es on es.id = el.espacio_id
  where es.inmueble_id = p_inmueble_id and es.activo and el.activo;

  get diagnostics v_total = row_count;
  if v_total = 0 then
    -- Al lanzar el error se deshace también el INSERT de la inspección.
    raise exception 'INVENTARIO_VACIO';
  end if;

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion, despues)
  values (v_org, (select auth.uid()), 'INSPECCION', v_id, 'PROGRAMADA',
          jsonb_build_object('inspector_id', p_inspector_id, 'tipo', p_tipo,
                             'programada_para', p_programada_para, 'elementos', v_total));

  return v_id;
end;
$$;

-- ---------- Editar fecha o nota (solo mientras está pendiente) ----------
create function public.editar_inspeccion(
  p_id              uuid,
  p_version         integer,
  p_programada_para timestamptz default null,
  p_nota            text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.inspecciones;
begin
  if not public.es_admin() then
    raise exception 'SIN_PERMISO';
  end if;

  select * into v from public.inspecciones
  where id = p_id and organizacion_id = public.mi_organizacion()
  for update;

  if not found then raise exception 'NO_ENCONTRADA'; end if;
  if v.estado <> 'PENDIENTE' then raise exception 'TRANSICION_INVALIDA'; end if;
  if v.version <> p_version then raise exception 'VERSION_CONFLICT'; end if;

  update public.inspecciones
  set programada_para = coalesce(p_programada_para, programada_para),
      nota = case when p_nota is null then nota else nullif(trim(p_nota), '') end,
      version = version + 1
  where id = p_id;

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion)
  values (v.organizacion_id, (select auth.uid()), 'INSPECCION', p_id, 'REPROGRAMADA');
end;
$$;

-- ---------- B5.2 Iniciar: PENDIENTE → EN_PROCESO ----------
create function public.iniciar_inspeccion(p_id uuid, p_version integer)
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

  -- Si no es SU inspección se responde igual que si no existiera.
  if not found or v.inspector_id <> (select auth.uid()) then
    raise exception 'NO_ENCONTRADA';
  end if;
  if v.estado <> 'PENDIENTE' then raise exception 'TRANSICION_INVALIDA'; end if;
  if v.version <> p_version then raise exception 'VERSION_CONFLICT'; end if;

  update public.inspecciones
  set estado = 'EN_PROCESO', iniciada_en = now(), version = version + 1
  where id = p_id;

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion)
  values (v.organizacion_id, (select auth.uid()), 'INSPECCION', p_id, 'INICIADA');
end;
$$;

-- ---------- B5.2 Guardar la evaluación de un elemento ----------
-- Concurrencia optimista: el cliente manda la versión que tenía. Si otra
-- pestaña guardó antes, la versión ya cambió y se rechaza en lugar de
-- pisar ese cambio. Devuelve la versión nueva.
create function public.guardar_detalle(
  p_inspeccion_id uuid,
  p_detalle_id    uuid,
  p_estado        public.elemento_estado,
  p_observacion   text,
  p_version       integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_insp    public.inspecciones;
  v_detalle public.detalles_inspeccion;
  v_obs     text := nullif(trim(coalesce(p_observacion, '')), '');
begin
  -- FOR SHARE: varios elementos se pueden guardar a la vez, pero ninguno
  -- mientras otra petición está finalizando o cancelando (FOR UPDATE).
  select * into v_insp from public.inspecciones
  where id = p_inspeccion_id and organizacion_id = public.mi_organizacion()
  for share;

  if not found or v_insp.inspector_id <> (select auth.uid()) then
    raise exception 'NO_ENCONTRADA';
  end if;
  if v_insp.estado = 'PENDIENTE' then raise exception 'INSPECCION_NO_INICIADA'; end if;
  if v_insp.estado <> 'EN_PROCESO' then raise exception 'INSPECCION_CERRADA'; end if;

  select * into v_detalle from public.detalles_inspeccion
  where id = p_detalle_id and inspeccion_id = p_inspeccion_id
  for update;

  if not found then raise exception 'NO_ENCONTRADA'; end if;
  if v_detalle.version <> p_version then raise exception 'VERSION_CONFLICT'; end if;
  if p_estado is null then raise exception 'ESTADO_REQUERIDO'; end if;
  if p_estado = 'NO_APLICA' and v_detalle.obligatorio_snapshot and v_obs is null then
    raise exception 'OBSERVACION_REQUERIDA';
  end if;

  update public.detalles_inspeccion
  set estado = p_estado, observacion = v_obs, version = version + 1
  where id = p_detalle_id;

  return v_detalle.version + 1;
end;
$$;

-- ---------- B5.3 Finalizar: EN_PROCESO → FINALIZADA ----------
create function public.finalizar_inspeccion(p_id uuid, p_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v            public.inspecciones;
  v_pendientes integer;
begin
  select * into v from public.inspecciones
  where id = p_id and organizacion_id = public.mi_organizacion()
  for update;

  if not found or v.inspector_id <> (select auth.uid()) then
    raise exception 'NO_ENCONTRADA';
  end if;
  if v.estado in ('FINALIZADA', 'CANCELADA') then raise exception 'INSPECCION_CERRADA'; end if;
  if v.estado <> 'EN_PROCESO' then raise exception 'TRANSICION_INVALIDA'; end if;
  if v.version <> p_version then raise exception 'VERSION_CONFLICT'; end if;

  -- Un obligatorio está pendiente si no tiene estado, o si se marcó
  -- "No aplica" sin justificarlo.
  select count(*) into v_pendientes
  from public.detalles_inspeccion
  where inspeccion_id = p_id
    and obligatorio_snapshot
    and (estado is null or (estado = 'NO_APLICA' and observacion is null));

  if v_pendientes > 0 then
    raise exception 'INSPECCION_INCOMPLETA' using detail = v_pendientes::text;
  end if;

  update public.inspecciones
  set estado = 'FINALIZADA', finalizada_en = now(), version = version + 1
  where id = p_id;

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion)
  values (v.organizacion_id, (select auth.uid()), 'INSPECCION', p_id, 'FINALIZADA');
end;
$$;

-- ---------- B5.3 Cancelar (solo el administrador, con motivo) ----------
create function public.cancelar_inspeccion(p_id uuid, p_motivo text, p_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v        public.inspecciones;
  v_motivo text := nullif(trim(coalesce(p_motivo, '')), '');
begin
  if not public.es_admin() then
    raise exception 'SIN_PERMISO';
  end if;

  select * into v from public.inspecciones
  where id = p_id and organizacion_id = public.mi_organizacion()
  for update;

  if not found then raise exception 'NO_ENCONTRADA'; end if;
  if v.estado in ('FINALIZADA', 'CANCELADA') then raise exception 'INSPECCION_CERRADA'; end if;
  if v.version <> p_version then raise exception 'VERSION_CONFLICT'; end if;
  if v_motivo is null then raise exception 'MOTIVO_REQUERIDO'; end if;

  update public.inspecciones
  set estado = 'CANCELADA', cancelada_en = now(), motivo_cancelacion = v_motivo, version = version + 1
  where id = p_id;

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion, antes, despues)
  values (v.organizacion_id, (select auth.uid()), 'INSPECCION', p_id, 'CANCELADA',
          jsonb_build_object('estado', v.estado), jsonb_build_object('motivo', v_motivo));
end;
$$;

-- ---------- B5.3 Reasignar a otro inspector ----------
create function public.reasignar_inspeccion(
  p_id           uuid,
  p_inspector_id uuid,
  p_motivo       text,
  p_version      integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v        public.inspecciones;
  v_motivo text := nullif(trim(coalesce(p_motivo, '')), '');
begin
  if not public.es_admin() then
    raise exception 'SIN_PERMISO';
  end if;

  select * into v from public.inspecciones
  where id = p_id and organizacion_id = public.mi_organizacion()
  for update;

  if not found then raise exception 'NO_ENCONTRADA'; end if;
  if v.estado in ('FINALIZADA', 'CANCELADA') then raise exception 'INSPECCION_CERRADA'; end if;
  if v.version <> p_version then raise exception 'VERSION_CONFLICT'; end if;
  if v.inspector_id = p_inspector_id then raise exception 'MISMO_INSPECTOR'; end if;
  -- Quitarle a alguien una inspección ya empezada exige dejar el porqué.
  if v.estado = 'EN_PROCESO' and v_motivo is null then raise exception 'MOTIVO_REQUERIDO'; end if;

  perform 1 from public.perfiles
  where id = p_inspector_id and organizacion_id = v.organizacion_id and rol = 'INSPECTOR' and activo;
  if not found then
    raise exception 'INSPECTOR_NO_DISPONIBLE';
  end if;

  update public.inspecciones
  set inspector_id = p_inspector_id, version = version + 1
  where id = p_id;

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion, antes, despues)
  values (v.organizacion_id, (select auth.uid()), 'INSPECCION', p_id, 'REASIGNADA',
          jsonb_build_object('inspector_id', v.inspector_id),
          jsonb_build_object('inspector_id', p_inspector_id, 'motivo', v_motivo));
end;
$$;

-- ---------- Permisos: solo usuarios con sesión ----------
revoke execute on function public.crear_inspeccion(uuid, uuid, public.inspeccion_tipo, timestamptz, text) from public, anon;
revoke execute on function public.editar_inspeccion(uuid, integer, timestamptz, text) from public, anon;
revoke execute on function public.iniciar_inspeccion(uuid, integer) from public, anon;
revoke execute on function public.guardar_detalle(uuid, uuid, public.elemento_estado, text, integer) from public, anon;
revoke execute on function public.finalizar_inspeccion(uuid, integer) from public, anon;
revoke execute on function public.cancelar_inspeccion(uuid, text, integer) from public, anon;
revoke execute on function public.reasignar_inspeccion(uuid, uuid, text, integer) from public, anon;

grant execute on function public.crear_inspeccion(uuid, uuid, public.inspeccion_tipo, timestamptz, text) to authenticated;
grant execute on function public.editar_inspeccion(uuid, integer, timestamptz, text) to authenticated;
grant execute on function public.iniciar_inspeccion(uuid, integer) to authenticated;
grant execute on function public.guardar_detalle(uuid, uuid, public.elemento_estado, text, integer) to authenticated;
grant execute on function public.finalizar_inspeccion(uuid, integer) to authenticated;
grant execute on function public.cancelar_inspeccion(uuid, text, integer) to authenticated;
grant execute on function public.reasignar_inspeccion(uuid, uuid, text, integer) to authenticated;
