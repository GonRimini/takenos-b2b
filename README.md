# Takenos B2B Portal MVP

Portal B2B para Takenos con dashboard, solicitudes de retiro y integración con Supabase.

## 🚀 Características

- **Dashboard en tiempo real** con balance y transacciones desde Retool
- **Sistema de retiros** con validación condicional por categoría
- **Notificaciones por email** usando Resend
- **Persistencia en Supabase** para solicitudes de retiro
- **UI moderna** con shadcn/ui y Tailwind CSS
- **Autenticación** integrada
- **Generación de PDFs** para comprobantes
- **Exportación a CSV** de transacciones

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de datos**: Supabase
- **Email**: Resend
- **PDF**: jsPDF
- **Validación**: Zod
- **Formularios**: React Hook Form

## 📋 Prerrequisitos

- Node.js 18+ 
- pnpm
- Cuenta en Supabase
- Cuenta en Resend
- API keys de Retool

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/GonRimini/takenos-b2b.git
cd takenos-b2b
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
# Retool API Keys
RETOOL_API_KEY=your_retool_api_key_here
RETOOL_TRANSACTIONS_API_KEY=your_retool_transactions_api_key_here

# Email (Resend)
RESEND_API_KEY=your_resend_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nqhzaiuumlaqkszxikcz.supabase.co
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key_here
```

4. **Configurar Supabase**
- Ve a tu dashboard de Supabase
- Ejecuta el SQL de `supabase-migration.sql` en el SQL Editor
- Esto creará la tabla `withdrawals` necesaria

5. **Ejecutar el proyecto**
```bash
pnpm dev
```

El proyecto estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
takenos-portal/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── balance/       # Balance y polling
│   │   ├── transactions/  # Transacciones desde Retool
│   │   └── withdrawals/   # Solicitudes de retiro
│   ├── dashboard/         # Dashboard principal
│   ├── retirar/          # Página de retiros
│   └── login/            # Autenticación
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   └── withdrawal-summary-modal.tsx
├── lib/                  # Utilidades y configuraciones
│   ├── auth.ts           # Autenticación
│   ├── supabase-server.ts # Cliente Supabase
│   ├── withdrawal-schema.ts # Validación Zod
│   └── pdf-generator.tsx # Generación de PDFs
└── public/               # Archivos estáticos
```

## 🔌 API Endpoints

### Balance
- `POST /api/balance` - Obtener balance actual
- `POST /api/balance/poll` - Polling de balance

### Transacciones
- `POST /api/transactions` - Obtener transacciones desde Retool

### Retiros
- `POST /api/withdrawals` - Crear solicitud de retiro
- `GET /api/withdrawals/pending` - Obtener retiros pendientes

## 📊 Funcionalidades

### Dashboard
- Balance en tiempo real
- Historial de transacciones
- Filtros por fecha
- Exportación a CSV
- Descarga de comprobantes PDF

### Sistema de Retiros
- **USD Bancario**: ACH/Wire con validación condicional
- **Criptomonedas**: BEP20, MATIC, TRC20
- **Moneda Local**: Bancos locales (Bolivia y otros países)
- Validación con Zod
- Notificaciones por email
- Persistencia en Supabase

### Email Notifications
- Envío automático a `grimini@takenos.com` y `fermin@takenos.com`
- Template HTML con branding de Takenos
- Incluye detalles completos de la solicitud

## 🚀 Deployment

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

### Otros
- Netlify
- Railway
- DigitalOcean App Platform

## 🔒 Seguridad

- Variables de entorno para credenciales
- Validación de datos con Zod
- Autenticación requerida
- CORS configurado
- Rate limiting recomendado para producción

## 📝 Scripts Disponibles

```bash
pnpm dev          # Desarrollo
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # Linting
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propiedad de Takenos.

## 📞 Soporte

Para soporte técnico, contacta a:
- **Email**: grimini@takenos.com
- **Desarrollador**: Gonzalo Rimini
