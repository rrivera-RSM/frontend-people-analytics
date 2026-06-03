# AGENTS.md

Guia rapida para agentes que trabajen en este repositorio. Objetivo: reducir exploracion repetitiva, mantener consistencia y ahorrar tokens en tareas recurrentes.

## Resumen del proyecto

- App frontend con `Next.js` (App Router), `React 19` y `TypeScript`.
- Estilos con `Tailwind CSS v4`.
- Componentes UI con librerias tipo `Radix UI`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- Formularios y validacion con `react-hook-form` + `zod`.
- Fetching/cache con `@tanstack/react-query`.
- Auth con `next-auth`.
- Graficos con `apexcharts` / `react-apexcharts` y `react-gauge-component`.

## Comandos utiles

- Instalar deps: `npm install`
- Desarrollo: `npm run dev`
- Lint: `npm run lint`
- Build produccion: `npm run build`
- Ejecutar build: `npm run start`

## Estructura base

- `app/`: rutas y layouts (App Router).
- `components/`: componentes reutilizables de UI y dominio.
- `hooks/`: hooks personalizados.
- `lib/`: utilidades y helpers.
- `config/`: configuraciones de aplicacion.
- `types/`: tipos compartidos.
- `public/`: estaticos.
- `middleware.ts`: middleware global de Next.

## Convenciones de trabajo para agentes

- Hacer cambios minimos y focalizados; evitar refactors amplios no pedidos.
- Respetar patrones existentes antes de introducir nuevos.
- Mantener `TypeScript` estricto: tipar props, retorno de funciones y datos externos.
- Priorizar componentes y utilidades ya existentes antes de duplicar logica.
- Si se agrega dependencias nuevas, justificar por que no alcanza con el stack actual.
- Ejecutar `npm run lint` tras cambios relevantes y reportar resultado.

## Checklist antes de cerrar una tarea

- El codigo compila o no rompe tipos de forma evidente.
- No se rompieron imports/rutas en `app/` ni en `components/`.
- Se mantuvo consistencia de estilos y nombres.
- Se corrio lint cuando aplicaba.
- Se documentaron supuestos si faltaba contexto.

## Notas para ahorrar tokens

- Consultar primero este archivo y luego solo los archivos directamente afectados.
- Evitar escanear todo el repo si la tarea es local a una ruta/componente.
- Reutilizar comandos y patrones ya definidos aqui en lugar de re-evaluarlos cada vez.
