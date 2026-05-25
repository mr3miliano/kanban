# Plan de Implementación: Kanban Pro Enhancements

## Fase 1: Arquitectura Base (Pinia)
**Objetivo:** Migrar la gestión de estado a Pinia y definir el nuevo modelo de datos.
- Archivos: `src/stores/kanban.js`, `src/main.js`.
- Agente: `coder`

## Fase 2: Componentes UI Atómicos (Paralelo)
**Objetivo:** Crear los subcomponentes necesarios para desacoplar el tablero.
- 2.1: `src/components/TaskCard.vue` (Visualización de etiquetas, prioridad, fechas).
- 2.2: `src/components/FiltersBar.vue` (Búsqueda y filtros).
- 2.3: `src/components/TaskModal.vue` (Formulario extendido con subtareas y comentarios).
- Agentes: `coder` (x3 en paralelo)

## Fase 3: Integración y Lógica de Workflow
**Objetivo:** Refactorizar `Board.vue` para usar el store y aplicar límites WIP y reglas de negocio.
- Archivos: `src/views/Board.vue`.
- Agente: `refactor`

## Fase 4: Colaboración e Historial
**Objetivo:** Implementar el registro de actividad y el sistema de comentarios.
- Archivos: `src/stores/kanban.js`, `src/components/TaskModal.vue`.
- Agente: `coder`

## Fase 5: Validación y Cierre
**Objetivo:** Pruebas finales de los roles (Roman, Valeria, Dayana, Emiliano).
- Agente: `tester`
