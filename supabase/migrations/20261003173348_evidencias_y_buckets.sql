-- =========================================================
-- InmoCheck — Fotos privadas (paso B6.1)
--
-- Los buckets son PRIVADOS y no tienen políticas para usuarios: desde el
-- navegador no se puede leer ni escribir nada. Solo el servidor (con la
-- clave service_role) sube, borra y genera enlaces firmados de 60 segundos,
-- y lo hace después de comprobar permisos. Así ninguna foto queda con un
-- enlace público permanente.
--
-- El bucket también limita tamaño y tipo de archivo como segunda barrera.
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('evidencias', 'evidencias', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('informes', 'informes', false, 20971520, array['application/pdf']);

-- Registra los metadatos de una foto ya subida a Storage.
-- Valida aquí (y no solo en la API) que la inspección sea del inspector,
-- esté en proceso y no se pase del máximo. El FOR UPDATE sobre el detalle
-- evita que dos subidas simultáneas superen el límite.
create function public.registrar_evidencia(
  p_id           uuid,
  p_detalle_id   uuid,
  p_storage_path text,
  p_mime_type    text,
  p_size_bytes   integer,
  p_descripcion  text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_detalle public.detalles_inspeccion;
  v_insp    public.inspecciones;
  v_total   integer;
  -- Debe coincidir con FOTOS_MAXIMAS_POR_ELEMENTO en lib/constantes.ts
  c_maximo  constant integer := 8;
begin
  select * into v_detalle from public.detalles_inspeccion
  where id = p_detalle_id and organizacion_id = public.mi_organizacion()
  for update;
  if not found then raise exception 'NO_ENCONTRADA'; end if;

  select * into v_insp from public.inspecciones where id = v_detalle.inspeccion_id for share;
  if v_insp.inspector_id <> (select auth.uid()) then raise exception 'NO_ENCONTRADA'; end if;
  if v_insp.estado = 'PENDIENTE' then raise exception 'INSPECCION_NO_INICIADA'; end if;
  if v_insp.estado <> 'EN_PROCESO' then raise exception 'INSPECCION_CERRADA'; end if;

  select count(*) into v_total from public.evidencias where detalle_id = p_detalle_id;
  if v_total >= c_maximo then raise exception 'LIMITE_FOTOS'; end if;

  insert into public.evidencias
    (id, organizacion_id, detalle_id, storage_path, mime_type, size_bytes, descripcion, created_by)
  values
    (p_id, v_detalle.organizacion_id, p_detalle_id, p_storage_path, p_mime_type, p_size_bytes,
     nullif(trim(coalesce(p_descripcion, '')), ''), (select auth.uid()));
end;
$$;

-- Borra los metadatos de una foto (solo en borrador) y devuelve su ruta
-- para que el servidor elimine el archivo de Storage.
create function public.eliminar_evidencia(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evidencia public.evidencias;
  v_insp      public.inspecciones;
begin
  select * into v_evidencia from public.evidencias
  where id = p_id and organizacion_id = public.mi_organizacion()
  for update;
  if not found then raise exception 'NO_ENCONTRADA'; end if;

  select i.* into v_insp
  from public.inspecciones i
  join public.detalles_inspeccion d on d.inspeccion_id = i.id
  where d.id = v_evidencia.detalle_id
  for share of i;

  if v_insp.inspector_id <> (select auth.uid()) then raise exception 'NO_ENCONTRADA'; end if;
  if v_insp.estado <> 'EN_PROCESO' then raise exception 'INSPECCION_CERRADA'; end if;

  delete from public.evidencias where id = p_id;
  return v_evidencia.storage_path;
end;
$$;

revoke execute on function public.registrar_evidencia(uuid, uuid, text, text, integer, text) from public, anon;
revoke execute on function public.eliminar_evidencia(uuid) from public, anon;
grant execute on function public.registrar_evidencia(uuid, uuid, text, text, integer, text) to authenticated;
grant execute on function public.eliminar_evidencia(uuid) to authenticated;
