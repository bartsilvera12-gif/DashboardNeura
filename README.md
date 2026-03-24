# DashboardNeura

Base inicial de un sistema SaaS para gestión empresarial y conexión con tiendas
de e-commerce.

## Stack tecnológico

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- Supabase (PostgreSQL + Auth), instancia self-hosted (`api.neura.com.py`)
- Deploy: Hostinger + GitHub (también compatible con Vercel)

## Módulos iniciales

- `Dashboard`
- `Stock`
- `Usuarios`
- `Empresas`

## Configuración local

1. Copia variables de entorno:

```bash
cp .env.example .env.local
```

2. Reemplaza valores en `.env.local` con tu proyecto de Supabase.

3. Ejecuta en desarrollo:

```bash
npm run dev
```

4. Abre `http://localhost:3000`.

## Estructura de rutas

- `/` inicio del proyecto
- `/dashboard` módulo Dashboard
- `/stock` módulo Stock
- `/usuarios` módulo Usuarios
- `/empresas` módulo Empresas

## Siguientes pasos recomendados

- Conectar Auth de Supabase (login/logout y sesión).
- Crear tablas base: `companies`, `profiles`, `roles`, `company_modules`.
- Implementar control de permisos por empresa y por módulo.
- Conectar integraciones de e-commerce (shop sync, stock sync, pedidos).

## Deploy (Hostinger u otro Node)

1. Subir el repo a GitHub y conectar el despliegue automático si aplica.
2. Definir en el panel las mismas variables que en `.env.production.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_BUSINESS_SCHEMA`).
3. Build: `npm run build` y arranque: `npm run start` (o el comando que use Hostinger).
4. En el servidor Supabase self-hosted, configura **Auth** (URLs de redirección) para el dominio público de la app.
