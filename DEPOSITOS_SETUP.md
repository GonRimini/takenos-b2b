# 🏦 Configuración de Métodos de Depósito en Supabase

## Resumen de cambios

Se ha migrado la información de métodos de depósito de Google Sheets a Supabase para mejorar:
- ⚡ Rendimiento y velocidad de carga
- 🔒 Seguridad de datos sensibles
- 🎯 Facilidad de actualización y mantenimiento

---

## 📋 Archivos creados/modificados

### Nuevos archivos:
1. **`lib/depositos.ts`** - Funciones para obtener datos de depósito desde Supabase
2. **`supabase-depositos-setup.sql`** - Script SQL para crear todas las tablas

### Archivos modificados:
3. **`app/depositar/page.tsx`** - Actualizado para usar Supabase en lugar de Google Sheets

---

## 🚀 Configuración en Supabase

### Paso 1: Ejecutar el script SQL

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú lateral izquierdo)
4. Copia **TODO** el contenido de `supabase-depositos-setup.sql`
5. Pégalo en el editor y click en **Run**

El script creará:
- ✅ 4 tablas: `depositos_ach`, `depositos_swift`, `depositos_crypto`, `depositos_local`
- ✅ Índices para búsquedas rápidas por email
- ✅ Datos de prueba para testing
- ✅ **RLS deshabilitado** temporalmente para desarrollo

---

## 📊 Estructura de las tablas

### 1. `depositos_ach`
```sql
- id (uuid)
- email (text)
- numero_cuenta (text)
- routing_number (text)
- nombre_beneficiario (text)
- banco_receptor (text)
- tipo_cuenta (text)
- direccion_beneficiario (text)
- direccion_banco (text)
```

### 2. `depositos_swift`
```sql
- id (uuid)
- email (text)
- swift_bic_code (text)
- numero_cuenta (text)
- nombre_beneficiario (text)
- banco_receptor (text)
- tipo_cuenta (text)
- direccion_beneficiario (text)
- direccion_banco (text)
```

### 3. `depositos_crypto`
```sql
- id (uuid)
- email (text)
- wallet_name (text) - ej: USDT, USDC, BTC
- direccion_deposito (text)
- red_network (text) - ej: ERC20, BEP20, TRC20
```

**Nota:** Un usuario puede tener múltiples wallets crypto.

### 4. `depositos_local`
```sql
- id (uuid)
- email (text)
- beneficiario (text)
- banco (text)
- numero_cuenta (text)
- nit_carnet (text)
```

---

## 💾 Agregar tus datos reales

### Opción 1: SQL Editor

Después de ejecutar el script inicial, agrega datos para tus usuarios:

```sql
-- ACH
insert into public.depositos_ach (
  email, numero_cuenta, routing_number, nombre_beneficiario, 
  banco_receptor, tipo_cuenta, direccion_beneficiario, direccion_banco
)
values (
  'usuario@ejemplo.com',
  '1234567890',
  '021000021',
  'Nombre del Beneficiario',
  'Nombre del Banco',
  'Checking',
  'Dirección del beneficiario completa',
  'Dirección del banco completa'
);

-- SWIFT
insert into public.depositos_swift (
  email, swift_bic_code, numero_cuenta, nombre_beneficiario,
  banco_receptor, tipo_cuenta, direccion_beneficiario, direccion_banco
)
values (
  'usuario@ejemplo.com',
  'CHASUS33',
  'US1234567890',
  'Nombre del Beneficiario',
  'Nombre del Banco',
  'Checking',
  'Dirección del beneficiario completa',
  'Dirección del banco completa'
);

-- Crypto (puedes insertar múltiples wallets para el mismo usuario)
insert into public.depositos_crypto (
  email, wallet_name, direccion_deposito, red_network
)
values 
  ('usuario@ejemplo.com', 'USDT', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'ERC20'),
  ('usuario@ejemplo.com', 'USDC', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Polygon');

-- Local
insert into public.depositos_local (
  email, beneficiario, banco, numero_cuenta, nit_carnet
)
values (
  'usuario@ejemplo.com',
  'Juan Pérez',
  'Banco Nacional',
  '1234567890',
  '12345678'
);
```

### Opción 2: Table Editor (UI)

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla que quieres editar
3. Click en **Insert row**
4. Completa los campos manualmente
5. Click en **Save**

---

## 🧪 Probar en local

### 1. El servidor debe estar corriendo

El servidor ya debería estar corriendo en http://localhost:3001 (o 3000).

Si no está corriendo:
```bash
pnpm dev
```

### 2. Probar cada método

1. Abre http://localhost:3001/depositar
2. Inicia sesión con un usuario cuyo email esté en las tablas
3. Prueba cada tab: ACH/Wire, SWIFT, Crypto, Moneda Local
4. Verifica que los datos se muestren correctamente

### 3. Ver logs en la consola

Abre la consola del navegador (F12) para ver logs como:
```
🔍 [ACH] Buscando para: usuario@ejemplo.com
✅ [ACH] Encontrado exitosamente
```

---

## ✅ Checklist de verificación

- [ ] Script SQL ejecutado sin errores
- [ ] Las 4 tablas existen en Supabase (`depositos_ach`, `depositos_swift`, `depositos_crypto`, `depositos_local`)
- [ ] RLS está deshabilitado en las 4 tablas (para desarrollo)
- [ ] Hay al menos un registro de prueba en cada tabla
- [ ] El email de prueba coincide con tu usuario de login
- [ ] Puedes ver los datos en http://localhost:3001/depositar
- [ ] El botón de "Actualizar" funciona correctamente
- [ ] El PDF de instrucciones se genera correctamente

---

## 🐛 Troubleshooting

### No se muestran datos

1. **Verifica que las tablas existen:**
   ```sql
   select table_name from information_schema.tables 
   where table_schema = 'public' 
   and table_name like 'depositos_%';
   ```

2. **Verifica que hay datos:**
   ```sql
   select email from depositos_ach;
   select email from depositos_swift;
   select email from depositos_crypto;
   select email from depositos_local;
   ```

3. **Verifica el email exacto:**
   - Ve a http://localhost:3001/test-limites
   - Copia el email que aparece en "Usuario Autenticado"
   - Usa ese email EXACTO en las tablas

### Error "permission denied"

RLS puede estar activo. Desactívalo:
```sql
alter table public.depositos_ach disable row level security;
alter table public.depositos_swift disable row level security;
alter table public.depositos_crypto disable row level security;
alter table public.depositos_local disable row level security;
```

### Múltiples wallets crypto no aparecen

Verifica que el usuario tiene múltiples registros:
```sql
select * from depositos_crypto where email = 'tu-email@ejemplo.com';
```

---

## 🔒 Para producción (después de testing)

Cuando todo funcione correctamente, activa RLS para seguridad:

```sql
-- Activar RLS en todas las tablas
alter table public.depositos_ach enable row level security;
alter table public.depositos_swift enable row level security;
alter table public.depositos_crypto enable row level security;
alter table public.depositos_local enable row level security;

-- Crear políticas de seguridad (ejemplo para ACH)
create policy "Usuarios leen sus depósitos ACH"
  on public.depositos_ach
  for select
  to authenticated
  using (lower(trim(email)) = lower(trim(auth.jwt()->>'email')));

-- Repetir para las otras tablas (swift, crypto, local)
```

---

## 📝 Migración de Google Sheets (si aplica)

Si ya tienes datos en Google Sheets:

1. Exporta cada hoja a CSV
2. Ve a Supabase → Table Editor → selecciona la tabla
3. Click en "Import data from CSV"
4. Mapea las columnas correctamente
5. Verifica que los datos se importaron bien

---

## 🎉 Beneficios de la migración

- ⚡ **Más rápido**: Carga instantánea vs varios segundos
- 🔒 **Más seguro**: Control de acceso con RLS
- 🎯 **Más fácil**: Actualizar datos directamente en Supabase
- 📊 **Mejor UX**: Sin delays ni spinners de carga largos
- 🔄 **Más confiable**: Sin límites de API de Google Sheets

