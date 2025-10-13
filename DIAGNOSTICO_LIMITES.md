# 🔧 Diagnóstico de Límites - Guía Rápida

## El problema: No se ven los límites

He creado herramientas para diagnosticar y solucionar el problema.

---

## 🚀 Solución Rápida (Recomendada)

### Paso 1: Ejecutar el script SQL simplificado

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú lateral izquierdo)
4. Copia **TODO** el contenido de `supabase-limites-dev.sql`
5. Pégalo en el editor y click en **Run**

Este script:
- ✅ Crea la tabla si no existe
- ✅ **DESACTIVA RLS** temporalmente (para desarrollo)
- ✅ Inserta datos de prueba

### Paso 2: Agregar tu email

Después de ejecutar el script, agrega un registro con tu email real:

```sql
insert into public.limites (email, limite, consumido, restante)
values 
  ('TU-EMAIL-AQUI@ejemplo.com', 10000, 3500, 6500);
```

**IMPORTANTE:** Usa el email exacto con el que inicias sesión.

### Paso 3: Verificar en la página de diagnóstico

1. Abre tu navegador en: http://localhost:3001/test-limites
2. Revisa los resultados de cada test
3. Busca errores en las secciones

---

## 🔍 Qué revisar en la página de diagnóstico

### ✅ Usuario Autenticado
Debe mostrar:
```json
{
  "email": "tu-email@ejemplo.com",
  "authenticated": true
}
```

### ✅ Conexión a Supabase
Debe mostrar:
```json
{
  "success": true,
  "error": null
}
```

### ✅ Consulta Directa
Debe mostrar:
```json
{
  "success": true,
  "count": 1,
  "data": [{ "email": "tu-email@ejemplo.com", "limite": 10000, ... }]
}
```

### ✅ Emails en la tabla
Debe mostrar una lista con tu email:
```json
{
  "success": true,
  "emails": ["test@example.com", "tu-email@ejemplo.com", ...]
}
```

---

## ❌ Posibles errores y soluciones

### Error: "No rows returned"
**Causa:** No hay ningún registro con tu email en la tabla

**Solución:**
```sql
-- En SQL Editor de Supabase
select * from public.limites;  -- Ver todos los registros

-- Si no está tu email, insertarlo:
insert into public.limites (email, limite, consumido, restante)
values ('TU-EMAIL-EXACTO@ejemplo.com', 10000, 3500, 6500);
```

### Error: "permission denied for table limites"
**Causa:** RLS (Row Level Security) está activo y bloqueando el acceso

**Solución:**
```sql
-- En SQL Editor de Supabase
alter table public.limites disable row level security;
```

### Error: "relation 'public.limites' does not exist"
**Causa:** La tabla no existe

**Solución:** Ejecutar el script `supabase-limites-dev.sql` completo

### Error: Email no coincide
**Causa:** El email en la tabla no coincide exactamente con el del usuario

**Solución:**
1. Ve a http://localhost:3001/test-limites
2. Copia el email exacto mostrado en "Usuario Autenticado"
3. Usa ese email exacto en la tabla:

```sql
-- Actualizar el email existente
update public.limites 
set email = 'EMAIL-EXACTO-DEL-DIAGNOSTICO@ejemplo.com'
where email = 'email-viejo@ejemplo.com';
```

---

## 📝 Checklist de verificación

- [ ] La tabla `limites` existe en Supabase
- [ ] RLS está desactivado (para desarrollo): `disable row level security`
- [ ] Hay al menos un registro en la tabla: `select * from limites;`
- [ ] El email del registro coincide EXACTAMENTE con tu email de login
- [ ] El servidor de desarrollo está corriendo: http://localhost:3001
- [ ] Puedes ver la página de diagnóstico: http://localhost:3001/test-limites
- [ ] La consola del navegador no muestra errores (F12 → Console)

---

## 🆘 Si todavía no funciona

1. **Captura de pantalla** de http://localhost:3001/test-limites
2. **Copia el output** de la consola del navegador (F12)
3. **Ejecuta en SQL Editor:**
   ```sql
   select * from public.limites;
   ```
   Y copia el resultado

Con esa información podremos identificar el problema exacto.

---

## 🔒 Para producción (después de que funcione)

Cuando todo funcione correctamente, activa RLS de nuevo para seguridad:

```sql
-- Activar RLS
alter table public.limites enable row level security;

-- Crear política segura
create policy "Usuarios leen sus límites"
  on public.limites
  for select
  to authenticated
  using (lower(trim(email)) = lower(trim(auth.jwt()->>'email')));
```

