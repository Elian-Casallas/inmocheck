-- =========================================================
-- InmoCheck — Pruebas de seguridad RLS (paso B2.3)
-- Requiere los datos de supabase/seed.sql.
--
-- Cómo funciona: "suplantamos" a cada usuario cambiando el rol de la
-- sesión a authenticated y poniendo su id en request.jwt.claims, que es
-- de donde auth.uid() lee quién está conectado. Cada prueba guarda lo
-- esperado y lo obtenido; al final se listan todas.
-- No deja cambios: todo ocurre dentro de una transacción con ROLLBACK.
-- =========================================================
begin;

create temp table resultados (
  n        serial,
  usuario  text,
  prueba   text,
  esperado text,
  obtenido text
) on commit drop;
grant all on resultados to authenticated, anon;
grant usage on sequence resultados_n_seq to authenticated, anon;

create function pg_temp.entrar_como(p_usuario uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_usuario, 'role', 'authenticated')::text, true);
end;
$$;

-- Cuenta desactivada: Mateo (Andes) queda inactivo solo durante la prueba.
update public.perfiles set activo = false
where id = 'b1000000-0000-4000-8000-000000000003';

-- ---------- Laura: inspectora asignada (Los Pinos) ----------
select pg_temp.entrar_como('a1000000-0000-4000-8000-000000000002');
set local role authenticated;
insert into resultados (usuario, prueba, esperado, obtenido) values
  ('Laura (inspectora asignada)', 'inmuebles que ve',     '1',  (select count(*) from public.inmuebles)::text),
  ('Laura (inspectora asignada)', 'inspecciones que ve',  '1',  (select count(*) from public.inspecciones)::text),
  ('Laura (inspectora asignada)', 'detalles que ve',      '12', (select count(*) from public.detalles_inspeccion)::text),
  ('Laura (inspectora asignada)', 'elementos de inventario que ve', '12', (select count(*) from public.elementos)::text),
  ('Laura (inspectora asignada)', 'propietarios que ve',  '0',  (select count(*) from public.personas)::text),
  ('Laura (inspectora asignada)', 'perfiles que ve',      '1',  (select count(*) from public.perfiles)::text),
  ('Laura (inspectora asignada)', 'auditoría que ve',     '0',  (select count(*) from public.auditoria)::text);
do $$
begin
  insert into public.inmuebles (organizacion_id, codigo, tipo, direccion, ciudad, departamento, propietario_id)
  values ('a0000000-0000-4000-8000-000000000001', 'HACK-1', 'CASA', 'Calle falsa 123', 'X', 'Y',
          'a2000000-0000-4000-8000-000000000001');
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Laura (inspectora asignada)', 'crear inmueble', 'rechazado', 'PERMITIDO');
exception when others then
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Laura (inspectora asignada)', 'crear inmueble', 'rechazado', 'rechazado');
end $$;
do $$
begin
  update public.inspecciones set estado = 'FINALIZADA';
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Laura (inspectora asignada)', 'finalizar con UPDATE directo, sin la función (CA-10)', 'rechazado', 'PERMITIDO');
exception when insufficient_privilege then
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Laura (inspectora asignada)', 'finalizar con UPDATE directo, sin la función (CA-10)', 'rechazado', 'rechazado');
end $$;
reset role;

-- ---------- Carlos: inspector NO asignado (Los Pinos) ----------
select pg_temp.entrar_como('a1000000-0000-4000-8000-000000000003');
set local role authenticated;
insert into resultados (usuario, prueba, esperado, obtenido) values
  ('Carlos (inspector no asignado)', 'inmuebles que ve',    '0', (select count(*) from public.inmuebles)::text),
  ('Carlos (inspector no asignado)', 'inspecciones que ve', '0', (select count(*) from public.inspecciones)::text),
  ('Carlos (inspector no asignado)', 'detalles que ve',     '0', (select count(*) from public.detalles_inspeccion)::text);
reset role;

-- ---------- Andrea: administradora de Los Pinos ----------
select pg_temp.entrar_como('a1000000-0000-4000-8000-000000000001');
set local role authenticated;
insert into resultados (usuario, prueba, esperado, obtenido) values
  ('Andrea (admin Los Pinos)', 'inmuebles que ve',    '2', (select count(*) from public.inmuebles)::text),
  ('Andrea (admin Los Pinos)', 'perfiles que ve',     '3', (select count(*) from public.perfiles)::text),
  ('Andrea (admin Los Pinos)', 'propietarios que ve', '2', (select count(*) from public.personas)::text),
  ('Andrea (admin Los Pinos)', 'inspecciones que ve', '1', (select count(*) from public.inspecciones)::text);
do $$
begin
  insert into public.inmuebles (organizacion_id, codigo, tipo, direccion, ciudad, departamento, propietario_id)
  values ('a0000000-0000-4000-8000-000000000001', 'APT-302', 'CASA', 'Otra dirección 1', 'X', 'Y',
          'a2000000-0000-4000-8000-000000000001');
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Andrea (admin Los Pinos)', 'crear inmueble con código repetido (CA-05)', 'rechazado', 'PERMITIDO');
exception when unique_violation then
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Andrea (admin Los Pinos)', 'crear inmueble con código repetido (CA-05)', 'rechazado', 'rechazado');
end $$;
with cambio as (
  update public.perfiles set nombre = 'Intento' where rol = 'ADMIN' returning 1
)
insert into resultados (usuario, prueba, esperado, obtenido)
select 'Andrea (admin Los Pinos)', 'filas al editar un perfil de administrador', '0', count(*)::text from cambio;
do $$
begin
  update public.perfiles set rol = 'ADMIN' where id = 'a1000000-0000-4000-8000-000000000002';
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Andrea (admin Los Pinos)', 'ascender a un inspector a admin', 'rechazado', 'PERMITIDO');
exception when others then
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Andrea (admin Los Pinos)', 'ascender a un inspector a admin', 'rechazado', 'rechazado');
end $$;
reset role;

-- ---------- Beatriz: administradora de OTRA organización (Andes) ----------
select pg_temp.entrar_como('b1000000-0000-4000-8000-000000000001');
set local role authenticated;
insert into resultados (usuario, prueba, esperado, obtenido) values
  ('Beatriz (admin Andes)', 'inmuebles que ve (solo los suyos)', '1', (select count(*) from public.inmuebles)::text),
  ('Beatriz (admin Andes)', 'inmuebles de Los Pinos que ve (CA-14)', '0',
     (select count(*) from public.inmuebles where organizacion_id = 'a0000000-0000-4000-8000-000000000001')::text),
  ('Beatriz (admin Andes)', 'inspecciones de Los Pinos que ve', '0', (select count(*) from public.inspecciones)::text),
  ('Beatriz (admin Andes)', 'perfiles que ve', '3', (select count(*) from public.perfiles)::text);
with cambio as (
  update public.inmuebles set descripcion = 'Intento'
  where id = 'a3000000-0000-4000-8000-000000000001' returning 1
)
insert into resultados (usuario, prueba, esperado, obtenido)
select 'Beatriz (admin Andes)', 'filas al editar un inmueble de Los Pinos', '0', count(*)::text from cambio;
do $$
begin
  insert into public.inmuebles (organizacion_id, codigo, tipo, direccion, ciudad, departamento, propietario_id)
  values ('a0000000-0000-4000-8000-000000000001', 'HACK-2', 'CASA', 'Calle falsa 123', 'X', 'Y',
          'a2000000-0000-4000-8000-000000000001');
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Beatriz (admin Andes)', 'crear inmueble dentro de Los Pinos', 'rechazado', 'PERMITIDO');
exception when others then
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Beatriz (admin Andes)', 'crear inmueble dentro de Los Pinos', 'rechazado', 'rechazado');
end $$;
reset role;

-- ---------- Mateo: cuenta desactivada con sesión vieja ----------
select pg_temp.entrar_como('b1000000-0000-4000-8000-000000000003');
set local role authenticated;
insert into resultados (usuario, prueba, esperado, obtenido) values
  ('Mateo (cuenta desactivada)', 'inmuebles que ve',    '0', (select count(*) from public.inmuebles)::text),
  ('Mateo (cuenta desactivada)', 'mi_rol() devuelve',   'nulo', coalesce((select public.mi_rol())::text, 'nulo'));
reset role;

-- ---------- Sin sesión (anon) ----------
set local role anon;
do $$
begin
  perform count(*) from public.inmuebles;
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Sin sesión', 'leer inmuebles', 'rechazado', 'PERMITIDO');
exception when insufficient_privilege then
  insert into resultados (usuario, prueba, esperado, obtenido)
  values ('Sin sesión', 'leer inmuebles', 'rechazado', 'rechazado');
end $$;
reset role;

select n, usuario, prueba, esperado, obtenido,
       case when esperado = obtenido then 'OK' else 'FALLA' end as resultado
from resultados
order by n;

rollback;
