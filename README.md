# DashboardNeura

Base inicial de un sistema SaaS para gestión empresarial y conexión con tiendas
de e-commerce.

## Stack tecnológico

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- Supabase (PostgreSQL + Auth)
- Deploy: Vercel + GitHub

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

## Deploy en Vercel con GitHub

1. Crear repositorio en GitHub y subir el proyecto.
2. En Vercel, importar el repo.
3. Configurar variables de entorno de Supabase en Vercel.
4. Desplegar.
