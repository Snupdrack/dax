# DAX Servicios Digitales

Plataforma de trámites digitales para servicios gubernamentales mexicanos. Permite a los usuarios solicitar trámites como actas, RFC, citas SAT, consultas IMSS, Infonavit y más.

## Tech Stack

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript 5
- **Base de Datos**: PostgreSQL (via Prisma ORM)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Animaciones**: Framer Motion
- **State Management**: React State + TanStack Query
- **Deployment**: Vercel

## Servicios Disponibles

27 trámites digitales organizados en 6 categorías:

| Categoría | Servicios |
|-----------|-----------|
| Actas | Nacimiento, Matrimonio, Divorcio, Defunción |
| RFC | RFC con IdCIF, RFC con CURP, Localización CURP |
| SAT | Citas, e.firma, Cambio de Domicilio, Corrección de Datos |
| Buró de Crédito | Consulta, Consulta con Score |
| IMSS | Semanas Cotizadas, NSS, Talón de Pago |
| Infonavit | Desbloqueo, Pre-calificación, Reporte Histórico |
| Servicios | CFE |

## Setup Local

### Prerrequisitos

- Node.js 18+ o Bun
- PostgreSQL (local o cloud como Neon/Supabase)

### Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   bun install
   ```

3. Configurar la base de datos en `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dax?schema=public"
   ```

4. Crear la base de datos PostgreSQL:
   ```sql
   CREATE DATABASE dax;
   ```

5. Aplicar el schema de Prisma:
   ```bash
   bun run db:push
   ```

6. Inicializar datos (seed):
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

7. Iniciar el servidor de desarrollo:
   ```bash
   bun run dev
   ```

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de PostgreSQL | `postgresql://user:password@localhost:5432/dax?schema=public` |

## Credenciales de Admin

- **Email**: admin@dax.com
- **Password**: admin123

## Deployment en Vercel

### Paso 1: Base de Datos

1. Crear una base de datos PostgreSQL en [Neon](https://neon.tech), [Supabase](https://supabase.com), o [Vercel Postgres](https://vercel.com/storage/postgres)
2. Copiar la connection string

### Paso 2: Deploy

1. Conectar el repositorio a Vercel
2. Configurar la variable de entorno `git` con la connection string de PostgreSQL
3. Deploy

### Paso 3: Inicializar Datos

Después del primer deploy, visitar:
```
https://tu-dominio.vercel.app/api/seed
```
(con método POST, por ejemplo usando curl o Postman)

Esto creará el usuario admin y los 27 servicios.

## Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx          # Aplicación principal (SPA)
│   └── api/              # API Routes
│       ├── auth/         # Login, Register, Me
│       ├── services/     # CRUD Servicios
│       ├── orders/       # CRUD Pedidos
│       ├── transactions/ # CRUD Transacciones
│       ├── admin/        # Admin endpoints
│       ├── upload/       # Upload de archivos
│       └── seed/         # Inicialización de BD
├── components/ui/        # shadcn/ui components
├── hooks/                # Custom hooks
└── lib/
    └── db.ts             # Prisma client
prisma/
└── schema.prisma         # Database schema
```

## Funcionalidades

### Usuario
- Registro e inicio de sesión
- Consulta de servicios y precios
- Solicitud de trámites con campos dinámicos
- Recarga de saldo mediante transferencia bancaria
- Seguimiento de pedidos con timeline visual
- Descarga de documentos de trámites completados
- Soporte por WhatsApp

### Administrador
- Panel de estadísticas
- Gestión de usuarios (activar/desactivar, editar saldo)
- Gestión de servicios (CRUD)
- Aprobación/rechazo de depósitos
- Gestión de pedidos:
  - Cambiar estado: Pendiente → En Proceso → Exitoso
  - Cancelar con reembolso automático
  - Subir documentos de resultado
  - Ver datos del trámite del usuario

## Información de Pago

- **Nombre**: Diego Cruz Mazariegos
- **Banco**: Mercado Pago
- **CLABE**: 722969028834827397
- **Tarjeta**: 5428 7807 5481 8680

## Soporte

WhatsApp: 961-314-2550

## Licencia

Propietario - DAX Servicios Digitales

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// ... existing code ...

export function RequiredFieldsEditor({
  value,
  onChange,
}: RequiredFieldsEditorProps) {
  const parseFields = (rawValue?: string | null): RequiredField[] => {
    if (!rawValue) return [];
    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [fields, setFields] = useState<RequiredField[]>(() => parseFields(value));

  useEffect(() => {
    setFields(parseFields(value));
  }, [value]);

  const [newField, setNewField] = useState<RequiredField>({
    key: '',
    label: '',
    required: true,
    type: 'text',
  });

// ... existing code ...
