-- =========================================================
-- InmoCheck — Seguridad a nivel de fila (pasos B2.1 y B2.2)
--
-- Idea central: aunque alguien salte la interfaz y llame directo a la
-- base de datos, PostgreSQL solo le devuelve las filas que su política
-- permite. El administrador ve todo lo de SU organización; el inspector
-- solo lo relacionado con SUS inspecciones asignadas.
--
-- No hay políticas de DELETE: nada se borra, todo se desactiva.
-- No hay políticas de escritura sobre inspecciones, detalles, evidencias,
-- informes ni auditoría: esos cambios solo ocurren mediante funciones
-- transaccionales (RPC) que validan estado, versión y permisos.
-- =========================================================

-- ---------- B2.1 Funciones de ayuda ----------
-- SECURITY DEFINER: se ejecutan con permisos del dueño para poder leer
-- perfiles sin caer en un ciclo con la propia política de perfiles.
-- search_path vacío: obliga a escribir public.tabla y evita que alguien
-- "cuele" una tabla falsa con el mismo nombre.
-- Si la cuenta está desactivada devuelven NULL, y con NULL ninguna
-- política se cumple: una cuenta inactiva no ve nada.

create function public.mi_organizacion()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organizacion_id
  from public.perfiles
  where id = (select auth.uid()) and activo;
$$;

create function public.mi_rol()
returns public.perfil_rol
language sql
stable
security definer
set search_path = ''
as $$
  select rol
  from public.perfiles
  where id = (select auth.uid()) and activo;
$$;

create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.mi_rol() = 'ADMIN', false);
$$;

-- ¿El usuario conectado es el inspector asignado de alguna inspección
-- de este inmueble? Va en función para no encadenar políticas.
create function public.tengo_inspeccion_en_inmueble(p_inmueble_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.inspecciones i
    where i.inmueble_id = p_inmueble_id
      and i.inspector_id = (select auth.uid())
      and i.organizacion_id = public.mi_organizacion()
  );
$$;

create function public.soy_inspector_de(p_inspeccion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.inspecciones i
    where i.id = p_inspeccion_id
      and i.inspector_id = (select auth.uid())
      and i.organizacion_id = public.mi_organizacion()
  );
$$;

revoke execute on function public.mi_organizacion()                  from public, anon;
revoke execute on function public.mi_rol()                           from public, anon;
revoke execute on function public.es_admin()                         from public, anon;
revoke execute on function public.tengo_inspeccion_en_inmueble(uuid) from public, anon;
revoke execute on function public.soy_inspector_de(uuid)             from public, anon;
revoke execute on function public.tocar_updated_at()                 from public, anon, authenticated;

grant execute on function public.mi_organizacion()                  to authenticated;
grant execute on function public.mi_rol()                           to authenticated;
grant execute on function public.es_admin()                         to authenticated;
grant execute on function public.tengo_inspeccion_en_inmueble(uuid) to authenticated;
grant execute on function public.soy_inspector_de(uuid)             to authenticated;

-- ---------- Permisos de tabla (primera barrera) ----------
-- Los usuarios sin sesión (anon) no tocan ninguna tabla.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on all tables in schema public to authenticated;
grant insert, update on public.personas, public.inmuebles,
                        public.espacios, public.elementos to authenticated;
-- De un perfil solo se pueden cambiar nombre y activo: nunca el rol ni la
-- organización, ni siquiera siendo administrador.
grant update (nombre, activo) on public.perfiles to authenticated;

-- ---------- B2.2 Activar RLS en las 11 tablas ----------
alter table public.organizaciones      enable row level security;
alter table public.perfiles            enable row level security;
alter table public.personas            enable row level security;
alter table public.inmuebles           enable row level security;
alter table public.espacios            enable row level security;
alter table public.elementos           enable row level security;
alter table public.inspecciones        enable row level security;
alter table public.detalles_inspeccion enable row level security;
alter table public.evidencias          enable row level security;
alter table public.informes            enable row level security;
alter table public.auditoria           enable row level security;

-- USING      = qué filas existentes puede ver o tocar.
-- WITH CHECK = cómo debe quedar la fila nueva o modificada.

-- organizaciones: cada quien ve solo la suya.
create policy organizaciones_ver on public.organizaciones
  for select to authenticated
  using (id = (select public.mi_organizacion()));

-- perfiles: cada quien ve el suyo; el admin ve los de su organización.
create policy perfiles_ver on public.perfiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()))
  );

-- El admin solo edita INSPECTORES de su organización (no a otros admin ni a sí mismo).
create policy perfiles_admin_edita_inspectores on public.perfiles
  for update to authenticated
  using (
    (select public.es_admin())
    and organizacion_id = (select public.mi_organizacion())
    and rol = 'INSPECTOR'
  )
  with check (
    organizacion_id = (select public.mi_organizacion())
    and rol = 'INSPECTOR'
  );

-- personas (propietarios): solo el admin.
create policy personas_admin_ver on public.personas
  for select to authenticated
  using ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()));

create policy personas_admin_crear on public.personas
  for insert to authenticated
  with check ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()));

create policy personas_admin_editar on public.personas
  for update to authenticated
  using ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()))
  with check (organizacion_id = (select public.mi_organizacion()));

-- inmuebles: el admin todo; el inspector solo los de sus inspecciones (CA-03).
create policy inmuebles_ver on public.inmuebles
  for select to authenticated
  using (
    organizacion_id = (select public.mi_organizacion())
    and ((select public.es_admin()) or public.tengo_inspeccion_en_inmueble(id))
  );

create policy inmuebles_admin_crear on public.inmuebles
  for insert to authenticated
  with check ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()));

create policy inmuebles_admin_editar on public.inmuebles
  for update to authenticated
  using ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()))
  with check (organizacion_id = (select public.mi_organizacion()));

-- espacios y elementos: el admin edita; el inspector lee el inventario
-- de los inmuebles que tiene asignados.
create policy espacios_ver on public.espacios
  for select to authenticated
  using (
    organizacion_id = (select public.mi_organizacion())
    and ((select public.es_admin()) or public.tengo_inspeccion_en_inmueble(inmueble_id))
  );

create policy espacios_admin_crear on public.espacios
  for insert to authenticated
  with check ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()));

create policy espacios_admin_editar on public.espacios
  for update to authenticated
  using ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()))
  with check (organizacion_id = (select public.mi_organizacion()));

create policy elementos_ver on public.elementos
  for select to authenticated
  using (
    organizacion_id = (select public.mi_organizacion())
    and (
      (select public.es_admin())
      or exists (
        select 1 from public.espacios e
        where e.id = elementos.espacio_id
          and public.tengo_inspeccion_en_inmueble(e.inmueble_id)
      )
    )
  );

create policy elementos_admin_crear on public.elementos
  for insert to authenticated
  with check ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()));

create policy elementos_admin_editar on public.elementos
  for update to authenticated
  using ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()))
  with check (organizacion_id = (select public.mi_organizacion()));

-- inspecciones: el admin las de su organización; el inspector solo las suyas (CA-06).
create policy inspecciones_ver on public.inspecciones
  for select to authenticated
  using (
    organizacion_id = (select public.mi_organizacion())
    and ((select public.es_admin()) or inspector_id = (select auth.uid()))
  );

-- detalles, evidencias e informes: el acceso se hereda de la inspección.
create policy detalles_ver on public.detalles_inspeccion
  for select to authenticated
  using (
    organizacion_id = (select public.mi_organizacion())
    and ((select public.es_admin()) or public.soy_inspector_de(inspeccion_id))
  );

create policy evidencias_ver on public.evidencias
  for select to authenticated
  using (
    organizacion_id = (select public.mi_organizacion())
    and (
      (select public.es_admin())
      or exists (
        select 1 from public.detalles_inspeccion d
        where d.id = evidencias.detalle_id
          and public.soy_inspector_de(d.inspeccion_id)
      )
    )
  );

create policy informes_ver on public.informes
  for select to authenticated
  using (
    organizacion_id = (select public.mi_organizacion())
    and ((select public.es_admin()) or public.soy_inspector_de(inspeccion_id))
  );

-- auditoría: solo lectura y solo para el admin.
create policy auditoria_admin_ver on public.auditoria
  for select to authenticated
  using ((select public.es_admin()) and organizacion_id = (select public.mi_organizacion()));
