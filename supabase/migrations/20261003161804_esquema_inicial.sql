-- =========================================================
-- InmoCheck — Esquema inicial (pasos B1.1 a B1.5)
-- 11 tablas, tipos enumerados, restricciones e índices.
--
-- Reglas que se repiten en todo el archivo:
--  * Toda tabla lleva organizacion_id: es la base del aislamiento
--    entre inmobiliarias (multi-tenant).
--  * Las llaves foráneas son COMPUESTAS (id, organizacion_id): así la
--    base de datos impide que un registro de la organización A apunte
--    a uno de la organización B.
--  * No hay ON DELETE CASCADE: el historial nunca se borra en cadena.
--    Los registros se desactivan (activo = false).
-- =========================================================

-- ---------- B1.1 Tipos enumerados ----------
create type public.perfil_rol        as enum ('ADMIN', 'INSPECTOR');
create type public.persona_tipo      as enum ('PROPIETARIO', 'ARRENDATARIO');
create type public.inmueble_tipo     as enum ('CASA', 'APARTAMENTO', 'OTRO');
create type public.inspeccion_tipo   as enum ('ENTRADA', 'SALIDA', 'SEGUIMIENTO');
create type public.inspeccion_estado as enum ('PENDIENTE', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA');
create type public.elemento_estado   as enum ('EXCELENTE', 'BUENO', 'REGULAR', 'DANADO', 'NO_APLICA');

-- ---------- Utilidad: mantener updated_at al día ----------
create function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- B1.2 Tablas núcleo ----------
create table public.organizaciones (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (char_length(nombre) between 2 and 120),
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Amplía al usuario de Supabase Auth con su rol y organización.
-- perfiles.id ES el id de auth.users (relación 1 a 1).
create table public.perfiles (
  id              uuid primary key references auth.users (id),
  organizacion_id uuid not null references public.organizaciones (id),
  nombre          text not null check (char_length(nombre) between 2 and 120),
  email           text not null,
  rol             public.perfil_rol not null,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (id, organizacion_id)
);

-- Propietarios y arrendatarios: son datos, NO cuentas de acceso.
create table public.personas (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id),
  nombre          text not null check (char_length(nombre) between 2 and 120),
  email           text,
  telefono        text check (char_length(telefono) <= 30),
  tipo            public.persona_tipo not null default 'PROPIETARIO',
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, organizacion_id)
);

create table public.inmuebles (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id),
  codigo          text not null check (char_length(codigo) between 2 and 40),
  tipo            public.inmueble_tipo not null,
  direccion       text not null check (char_length(direccion) between 5 and 240),
  barrio          text,
  ciudad          text not null,
  departamento    text not null,
  habitaciones    integer not null default 0 check (habitaciones >= 0),
  banos           integer not null default 0 check (banos >= 0),
  area_m2         numeric(8, 2) check (area_m2 > 0),
  descripcion     text,
  propietario_id  uuid not null,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, organizacion_id),
  -- El código se puede repetir en otra inmobiliaria, pero no en la misma (CA-05).
  constraint uq_inmueble_codigo unique (organizacion_id, codigo),
  constraint fk_inmueble_propietario
    foreign key (propietario_id, organizacion_id)
    references public.personas (id, organizacion_id)
);

-- ---------- B1.3 Inventario ----------
create table public.espacios (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id),
  inmueble_id     uuid not null,
  nombre          text not null check (char_length(nombre) between 2 and 80),
  orden           integer not null default 0,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (id, organizacion_id),
  constraint fk_espacio_inmueble
    foreign key (inmueble_id, organizacion_id)
    references public.inmuebles (id, organizacion_id)
);

-- El id del elemento es estable: con él se compara entrada contra salida.
create table public.elementos (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id),
  espacio_id      uuid not null,
  nombre          text not null check (char_length(nombre) between 2 and 80),
  obligatorio     boolean not null default true,
  orden           integer not null default 0,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (id, organizacion_id),
  constraint fk_elemento_espacio
    foreign key (espacio_id, organizacion_id)
    references public.espacios (id, organizacion_id)
);

-- ---------- B1.4 Inspecciones y detalles ----------
create table public.inspecciones (
  id                 uuid primary key default gen_random_uuid(),
  organizacion_id    uuid not null references public.organizaciones (id),
  inmueble_id        uuid not null,
  inspector_id       uuid not null,
  tipo               public.inspeccion_tipo not null,
  estado             public.inspeccion_estado not null default 'PENDIENTE',
  programada_para    timestamptz not null,
  nota               text check (char_length(nota) <= 1000),
  iniciada_en        timestamptz,
  finalizada_en      timestamptz,
  cancelada_en       timestamptz,
  motivo_cancelacion text,
  -- Control de concurrencia optimista: cada cambio suma 1.
  version            integer not null default 1,
  creada_por         uuid references public.perfiles (id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (id, organizacion_id),
  constraint fk_inspeccion_inmueble
    foreign key (inmueble_id, organizacion_id)
    references public.inmuebles (id, organizacion_id),
  constraint fk_inspeccion_inspector
    foreign key (inspector_id, organizacion_id)
    references public.perfiles (id, organizacion_id)
);

-- Una fila por elemento evaluado. Las columnas *_snapshot son la copia
-- histórica: guardan cómo se llamaba el espacio y el elemento el día en que
-- se creó la inspección, aunque después cambie el inventario.
create table public.detalles_inspeccion (
  id                       uuid primary key default gen_random_uuid(),
  organizacion_id          uuid not null references public.organizaciones (id),
  inspeccion_id            uuid not null,
  elemento_id              uuid not null references public.elementos (id),
  espacio_nombre_snapshot  text not null,
  elemento_nombre_snapshot text not null,
  obligatorio_snapshot     boolean not null,
  espacio_orden_snapshot   integer not null default 0,
  elemento_orden_snapshot  integer not null default 0,
  estado                   public.elemento_estado,
  observacion              text check (char_length(observacion) <= 2000),
  version                  integer not null default 1,
  updated_at               timestamptz not null default now(),
  unique (id, organizacion_id),
  constraint uq_detalle_elemento unique (inspeccion_id, elemento_id),
  constraint fk_detalle_inspeccion
    foreign key (inspeccion_id, organizacion_id)
    references public.inspecciones (id, organizacion_id)
);

-- ---------- B1.5 Evidencias, informes y auditoría ----------
-- La foto vive en Storage (bucket privado); aquí solo su ruta y metadatos.
create table public.evidencias (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id),
  detalle_id      uuid not null,
  storage_path    text not null unique,
  mime_type       text not null,
  size_bytes      integer not null check (size_bytes > 0),
  descripcion     text check (char_length(descripcion) <= 300),
  created_by      uuid not null references public.perfiles (id),
  created_at      timestamptz not null default now(),
  constraint fk_evidencia_detalle
    foreign key (detalle_id, organizacion_id)
    references public.detalles_inspeccion (id, organizacion_id)
);

create table public.informes (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id),
  inspeccion_id   uuid not null,
  version         integer not null check (version >= 1),
  storage_path    text not null unique,
  sha256          text,
  generado_en     timestamptz not null default now(),
  generado_por    uuid not null references public.perfiles (id),
  constraint uq_informe_version unique (inspeccion_id, version),
  constraint fk_informe_inspeccion
    foreign key (inspeccion_id, organizacion_id)
    references public.inspecciones (id, organizacion_id)
);

create table public.auditoria (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id),
  actor_id        uuid references public.perfiles (id),
  recurso         text not null,
  recurso_id      uuid not null,
  accion          text not null,
  antes           jsonb,
  despues         jsonb,
  fecha           timestamptz not null default now()
);

-- ---------- Triggers de updated_at ----------
create trigger trg_personas_updated_at
  before update on public.personas
  for each row execute function public.tocar_updated_at();

create trigger trg_inmuebles_updated_at
  before update on public.inmuebles
  for each row execute function public.tocar_updated_at();

create trigger trg_inspecciones_updated_at
  before update on public.inspecciones
  for each row execute function public.tocar_updated_at();

create trigger trg_detalles_updated_at
  before update on public.detalles_inspeccion
  for each row execute function public.tocar_updated_at();

-- ---------- Índices ----------
-- Se indexa lo que la app busca: por organización, estado, fecha y por
-- las llaves foráneas que se usan en los JOIN.
create index idx_perfiles_org_rol        on public.perfiles (organizacion_id, rol);
create index idx_personas_org_nombre     on public.personas (organizacion_id, nombre);
create index idx_inmuebles_org_activo    on public.inmuebles (organizacion_id, activo);
create index idx_inmuebles_propietario   on public.inmuebles (propietario_id);
create index idx_espacios_inmueble       on public.espacios (inmueble_id, orden);
create index idx_elementos_espacio       on public.elementos (espacio_id, orden);
create index idx_inspecciones_org_estado_fecha
  on public.inspecciones (organizacion_id, estado, programada_para desc);
create index idx_inspecciones_inspector_estado
  on public.inspecciones (inspector_id, estado, programada_para);
create index idx_inspecciones_inmueble   on public.inspecciones (inmueble_id, programada_para desc);
create index idx_detalles_inspeccion     on public.detalles_inspeccion (inspeccion_id);
create index idx_detalles_elemento       on public.detalles_inspeccion (elemento_id);
create index idx_evidencias_detalle      on public.evidencias (detalle_id);
create index idx_informes_inspeccion     on public.informes (inspeccion_id);
create index idx_auditoria_org_fecha     on public.auditoria (organizacion_id, fecha desc);
create index idx_auditoria_recurso       on public.auditoria (recurso, recurso_id);
