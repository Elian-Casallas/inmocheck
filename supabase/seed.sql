-- =========================================================
-- InmoCheck — Datos de prueba (paso B1.6). TODO es inventado.
-- Pensado para una base recién creada (no ejecutar dos veces).
--
-- Dos inmobiliarias a propósito: sin una segunda organización no se
-- puede demostrar que la A no ve los datos de la B (CA-14).
--
-- Cuentas (todas con la misma contraseña de demostración):
--   Los Pinos: admin@pinos.test · laura@pinos.test · carlos@pinos.test
--   Andes:     admin@andes.test · sofia@andes.test · mateo@andes.test
-- Contraseña de demostración: InmoCheck.Demo2026
-- =========================================================

-- ---------- Organizaciones ----------
insert into public.organizaciones (id, nombre) values
  ('a0000000-0000-4000-8000-000000000001', 'Inmobiliaria Los Pinos'),
  ('b0000000-0000-4000-8000-000000000001', 'Inmobiliaria Andes');

-- ---------- Usuarios de Supabase Auth ----------
with cuentas (id, email, nombre) as (
  values
    ('a1000000-0000-4000-8000-000000000001'::uuid, 'admin@pinos.test',  'Andrea Pinzón'),
    ('a1000000-0000-4000-8000-000000000002'::uuid, 'laura@pinos.test',  'Laura Díaz'),
    ('a1000000-0000-4000-8000-000000000003'::uuid, 'carlos@pinos.test', 'Carlos Rojas'),
    ('b1000000-0000-4000-8000-000000000001'::uuid, 'admin@andes.test',  'Beatriz Andrade'),
    ('b1000000-0000-4000-8000-000000000002'::uuid, 'sofia@andes.test',  'Sofía Mora'),
    ('b1000000-0000-4000-8000-000000000003'::uuid, 'mateo@andes.test',  'Mateo Gil')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('InmoCheck.Demo2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('nombre', nombre),
  now(), now(), '', '', '', ''
from cuentas;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@pinos.test' or u.email like '%@andes.test';

-- ---------- Perfiles: rol y organización de cada cuenta ----------
insert into public.perfiles (id, organizacion_id, nombre, email, rol) values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Andrea Pinzón',   'admin@pinos.test',  'ADMIN'),
  ('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Laura Díaz',      'laura@pinos.test',  'INSPECTOR'),
  ('a1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Carlos Rojas',    'carlos@pinos.test', 'INSPECTOR'),
  ('b1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Beatriz Andrade', 'admin@andes.test',  'ADMIN'),
  ('b1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Sofía Mora',      'sofia@andes.test',  'INSPECTOR'),
  ('b1000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Mateo Gil',       'mateo@andes.test',  'INSPECTOR');

-- ---------- Propietarios ----------
insert into public.personas (id, organizacion_id, nombre, email, telefono) values
  ('a2000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'María López',   'maria.lopez@example.com',  '+57 300 000 0001'),
  ('a2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Jorge Ramírez', 'jorge.ramirez@example.com', '+57 300 000 0002'),
  ('b2000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Ana Torres',    'ana.torres@example.com',   '+57 300 000 0003');

-- ---------- Inmuebles ----------
-- APT-302 existe en las DOS organizaciones: el código solo es único
-- dentro de cada una.
insert into public.inmuebles
  (id, organizacion_id, codigo, tipo, direccion, barrio, ciudad, departamento, habitaciones, banos, area_m2, descripcion, propietario_id)
values
  ('a3000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'APT-302',  'APARTAMENTO', 'Calle 10 #20-30, apartamento 302', 'Centro',     'Villavicencio', 'Meta',         3, 2, 85.50,  'Apartamento residencial', 'a2000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'CASA-014', 'CASA',        'Carrera 45 #12-08',                'La Esperanza', 'Villavicencio', 'Meta',         4, 3, 140.00, 'Casa de dos pisos',       'a2000000-0000-4000-8000-000000000002'),
  ('b3000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'APT-302',  'APARTAMENTO', 'Avenida 19 #100-21, apartamento 302', 'Chicó',    'Bogotá',        'Cundinamarca', 2, 2, 68.00,  'Apartamento amoblado',    'b2000000-0000-4000-8000-000000000001');

-- ---------- Inventario: espacios ----------
insert into public.espacios (id, organizacion_id, inmueble_id, nombre, orden) values
  ('a4000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'Cocina',           1),
  ('a4000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'Baño principal',   2),
  ('a4000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'Sala comedor',     3),
  ('a4000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002', 'Cocina',           1),
  ('a4000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002', 'Habitación principal', 2),
  ('b4000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'Cocina',           1),
  ('b4000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'Baño',             2);

-- ---------- Inventario: elementos ----------
insert into public.elementos (organizacion_id, espacio_id, nombre, obligatorio, orden) values
  -- Los Pinos · APT-302 · Cocina (5 elementos)
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Paredes',   true,  1),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Piso',      true,  2),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Grifería',  true,  3),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Gabinetes', true,  4),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Enchufes',  false, 5),
  -- Los Pinos · APT-302 · Baño principal
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000002', 'Sanitario', true,  1),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000002', 'Lavamanos', true,  2),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000002', 'Ducha',     true,  3),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000002', 'Espejo',    false, 4),
  -- Los Pinos · APT-302 · Sala comedor
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000003', 'Paredes',   true,  1),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000003', 'Piso',      true,  2),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000003', 'Ventanas',  true,  3),
  -- Los Pinos · CASA-014
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000004', 'Paredes',   true,  1),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000004', 'Grifería',  true,  2),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000005', 'Puerta',    true,  1),
  ('a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000005', 'Clóset',    false, 2),
  -- Andes · APT-302
  ('b0000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'Paredes',   true,  1),
  ('b0000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'Grifería',  true,  2),
  ('b0000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000002', 'Sanitario', true,  1),
  ('b0000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000002', 'Lavamanos', true,  2);

-- ---------- Una inspección pendiente para probar permisos ----------
-- Entrada de APT-302 (Los Pinos) asignada a Laura. Carlos NO la debe ver.
insert into public.inspecciones
  (id, organizacion_id, inmueble_id, inspector_id, tipo, programada_para, nota, creada_por)
values
  ('a5000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002',
   'ENTRADA', now() + interval '2 days', 'Revisar especialmente la cocina',
   'a1000000-0000-4000-8000-000000000001');

-- Copia (snapshot) del inventario vigente hacia los detalles de la inspección.
insert into public.detalles_inspeccion
  (organizacion_id, inspeccion_id, elemento_id, espacio_nombre_snapshot, elemento_nombre_snapshot,
   obligatorio_snapshot, espacio_orden_snapshot, elemento_orden_snapshot)
select
  el.organizacion_id, 'a5000000-0000-4000-8000-000000000001', el.id, es.nombre, el.nombre,
  el.obligatorio, es.orden, el.orden
from public.elementos el
join public.espacios es on es.id = el.espacio_id
where es.inmueble_id = 'a3000000-0000-4000-8000-000000000001'
  and es.activo and el.activo;
