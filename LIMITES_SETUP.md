# Configuración de Límites en Supabase

## Cambios realizados

Se ha migrado la tabla de límites de Google Sheets a Supabase para mejorar el rendimiento y la seguridad.

### Archivos creados/modificados:

1. **`lib/limites.ts`** - Nueva función para obtener límites desde Supabase
2. **`app/ayuda/page.tsx`** - Actualizado para usar Supabase en lugar de Google Sheets
3. **`supabase-limites-setup.sql`** - Script SQL para crear la tabla y datos de prueba

## Configuración en Supabase

### Paso 1: Ejecutar el script SQL

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Ve a "SQL Editor" en el menú lateral
3. Copia todo el contenido de `supabase-limites-setup.sql`
4. Pégalo en el editor SQL y ejecuta (Run)

El script creará:
- ✅ La tabla `limites` con el esquema correcto
- ✅ Políticas de seguridad (RLS) para proteger los datos
- ✅ Índice en el campo `email` para búsquedas rápidas
- ✅ Datos de prueba

### Paso 2: Añadir tus datos reales

Después de ejecutar el script, agrega tus datos reales:

```sql
-- Reemplaza con el email del usuario que estás probando
insert into public.limites (email, limite, consumido, restante)
values 
  ('tu-email@example.com', 10000, 3500, 6500);
```

O usa el Editor de Tablas en Supabase:
1. Ve a "Table Editor" → "limites"
2. Click en "Insert row"
3. Completa los campos:
   - `email`: Tu email de prueba
   - `limite`: Límite mensual (ej: 10000)
   - `consumido`: Monto consumido (ej: 3500)
   - `restante`: Monto restante (ej: 6500)

## Probar localmente

### Paso 1: Verificar variables de entorno

Asegúrate de tener en tu archivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### Paso 2: Instalar dependencias (si es necesario)

```bash
pnpm install
```

### Paso 3: Ejecutar el servidor de desarrollo

```bash
pnpm dev
```

### Paso 4: Probar la funcionalidad

1. Abre http://localhost:3000 en tu navegador
2. Inicia sesión con un usuario cuyo email esté en la tabla `limites`
3. Ve a la página `/ayuda`
4. Expande la sección "¿Cuál es mi límite mensual?"
5. Deberías ver la barra de progreso con tus límites

## Verificar que funciona

Si todo está correctamente configurado, deberías ver en la consola del navegador:

```
✅ Límites encontrados para: tu-email@example.com {id: "...", email: "...", ...}
```

Si hay un error, verás:

```
❌ Error obteniendo límites: [mensaje de error]
```

## Estructura de la tabla

```sql
limites
├── id (uuid, primary key)
├── email (text)
├── limite (numeric)
├── consumido (numeric)
└── restante (numeric)
```

## Seguridad

La tabla tiene habilitado Row Level Security (RLS), lo que significa que:
- ✅ Los usuarios solo pueden ver sus propios límites
- ✅ No pueden ver los límites de otros usuarios
- ✅ Solo usuarios autenticados pueden acceder

