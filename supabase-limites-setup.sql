-- Crear la tabla limites en Supabase
-- Este script crea la tabla y añade datos de prueba

-- Crear la tabla limites si no existe
create table if not exists public.limites (
  id uuid not null default extensions.uuid_generate_v4(),
  email text null,
  limite numeric null,
  consumido numeric null,
  restante numeric null,
  constraint limites_pkey primary key (id)
) tablespace pg_default;

-- Habilitar Row Level Security (RLS)
alter table public.limites enable row level security;

-- IMPORTANTE: Eliminar políticas existentes si las hay
drop policy if exists "Usuarios autenticados pueden leer sus propios límites" on public.limites;
drop policy if exists "Usuarios autenticados pueden insertar sus propios límites" on public.limites;
drop policy if exists "Usuarios autenticados pueden actualizar sus propios límites" on public.limites;

-- Crear política PERMISIVA para permitir lectura a usuarios autenticados
-- Esta política permite que los usuarios lean sus propios límites basándose en su email
create policy "Permitir lectura de límites a usuarios autenticados"
  on public.limites
  for select
  to authenticated
  using (
    lower(trim(email)) = lower(trim(auth.jwt()->>'email'))
  );

-- Política alternativa para desarrollo: permitir todo (comentada por seguridad)
-- Descomentar SOLO para desarrollo/testing local
-- create policy "allow_all_for_testing" on public.limites for all using (true);

-- Datos de prueba (ajusta el email al que uses para probar)
insert into public.limites (email, limite, consumido, restante)
values 
  ('test@example.com', 10000, 3500, 6500),
  ('usuario@takenos.com', 50000, 25000, 25000)
on conflict (id) do nothing;

-- Crear índice en email para búsquedas más rápidas
create index if not exists limites_email_idx on public.limites (email);

