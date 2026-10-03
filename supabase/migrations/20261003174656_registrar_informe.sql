-- =========================================================
-- InmoCheck — Registro de informes PDF (paso B7.2)
--
-- El PDF se genera y se sube desde el servidor; esta función guarda su
-- registro. Solo acepta inspecciones FINALIZADAS y solo de quien puede
-- verlas (admin de la organización o inspector asignado).
-- UNIQUE(inspeccion_id, version) impide dos informes con la misma versión
-- si dos personas lo generan a la vez.
-- =========================================================
create function public.registrar_informe(
  p_id            uuid,
  p_inspeccion_id uuid,
  p_version       integer,
  p_storage_path  text,
  p_sha256        text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.inspecciones;
begin
  select * into v from public.inspecciones
  where id = p_inspeccion_id and organizacion_id = public.mi_organizacion()
  for share;

  if not found then raise exception 'NO_ENCONTRADA'; end if;
  if not public.es_admin() and v.inspector_id <> (select auth.uid()) then
    raise exception 'NO_ENCONTRADA';
  end if;
  if v.estado <> 'FINALIZADA' then raise exception 'INSPECCION_NO_FINALIZADA'; end if;

  insert into public.informes
    (id, organizacion_id, inspeccion_id, version, storage_path, sha256, generado_por)
  values
    (p_id, v.organizacion_id, p_inspeccion_id, p_version, p_storage_path, p_sha256, (select auth.uid()));

  insert into public.auditoria (organizacion_id, actor_id, recurso, recurso_id, accion, despues)
  values (v.organizacion_id, (select auth.uid()), 'INSPECCION', p_inspeccion_id, 'INFORME_GENERADO',
          jsonb_build_object('informe_id', p_id, 'version', p_version));
end;
$$;

revoke execute on function public.registrar_informe(uuid, uuid, integer, text, text) from public, anon;
grant execute on function public.registrar_informe(uuid, uuid, integer, text, text) to authenticated;
