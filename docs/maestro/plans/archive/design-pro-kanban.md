# Documento de Diseño: Kanban Pro Enhancements (Fases 1, 2 y 3)

## Introducción
Este documento detalla la evolución del MVP de Kanban a una herramienta de gestión de proyectos profesional, implementando gestión avanzada de tareas, mejoras en el flujo de trabajo y herramientas de colaboración.

## Objetivos
1.  **Fase 1 (Gestión de Tareas):** Enriquecer el modelo de datos con prioridad, puntos de historia, etiquetas, fechas y subtareas.
2.  **Fase 2 (Workflow):** Implementar límites de WIP, filtros de búsqueda y lógica de rechazo en revisión.
3.  **Fase 3 (Colaboración):** Añadir comentarios, historial de actividad y soporte para múltiples asignados.

## Arquitectura del Sistema
Para soportar la complejidad, migraremos la lógica de estado a **Pinia**, permitiendo una gestión más limpia y centralizada que la actual basada en `reactive` dentro de un solo componente.

### Modelo de Datos (Store)
`useKanbanStore.js`:
- `tasks`: Array de objetos de tarea extendidos.
- `filters`: Estado de los filtros activos.
- `config`: Configuración del tablero (ej. límites WIP).

### Componentes UI (Refactorización)
- `Board.vue`: Componente principal, ahora más delgado, delegando en subcomponentes.
- `TaskCard.vue`: Nueva representación visual con indicadores de prioridad y progreso.
- `TaskModal.vue`: Modal enriquecido para edición completa.
- `FiltersBar.vue`: Componente superior para segmentar tareas.

## Reglas de Negocio Extendidas
- **Límites WIP:** Alertas o bloqueos si una columna excede su capacidad.
- **Trazabilidad:** Cada cambio de estado genera automáticamente una entrada en el historial de `activity`.
- **Restricciones de Rol:** Se mantienen (Admin maneja `done` y borrado; Dev maneja flujo operativo).

## Plan de Datos (Local Storage)
Se mantendrá el uso de `localStorage` para la persistencia, pero con una estructura JSON más robusta que soporte las nuevas colecciones anidadas (comentarios, actividad).
