-- Script SIMPLIFICADO para desarrollo/testing
-- Este script desactiva RLS temporalmente para facilitar el testing

-- Crear la tabla limites si no existe
create table if not exists public.limites (
  id uuid not null default gen_random_uuid(),
  email text null,
  limite numeric null,
  consumido numeric null,
  restante numeric null,
  constraint limites_pkey primary key (id)
) tablespace pg_default;

-- DESHABILITAR RLS temporalmente para desarrollo
alter table public.limites disable row level security;

-- Eliminar políticas existentes
drop policy if exists "Permitir lectura de límites a usuarios autenticados" on public.limites;
drop policy if exists "allow_all_for_testing" on public.limites;

-- Limpiar datos existentes (opcional, comentar si quieres mantener datos)
-- truncate table public.limites;

-- Insertar datos de prueba
-- IMPORTANTE: Reemplaza 'tu-email@ejemplo.com' con el email que usas para login
insert into public.limites (email, limite, consumido, restante)
values 
  ('test@example.com', 10000, 3500, 6500),
  ('usuario@takenos.com', 50000, 25000, 25000),
  ('gonrimini@gmail.com', 15000, 8000, 7000)
on conflict (id) do nothing;

-- Crear índice en email para búsquedas más rápidas
create index if not exists limites_email_idx on public.limites (lower(email));

-- Verificar los datos insertados
select * from public.limites;

