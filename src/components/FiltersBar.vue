<template>
  <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Search -->
      <div class="flex-1 min-w-[200px]">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            v-model="kanbanStore.filters.search"
            type="text"
            placeholder="Buscar tareas..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
          />
        </div>
      </div>

      <!-- Priority -->
      <div class="w-40">
        <select
          v-model="kanbanStore.filters.priority"
          class="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 transition-all"
        >
          <option value="">Todas las prioridades</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </div>

      <!-- Assigned To -->
      <div class="w-48">
        <select
          v-model="kanbanStore.filters.assignedTo"
          class="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 transition-all"
        >
          <option value="">Todos los usuarios</option>
          <option v-for="user in availableUsers" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
      </div>

      <!-- Tags -->
      <div class="w-48">
        <select
          v-model="selectedTag"
          @change="addTag"
          class="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 transition-all"
        >
          <option value="">Filtrar por etiqueta</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
      </div>

      <!-- Clear Filters -->
      <button
        @click="clearFilters"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
      >
        Limpiar filtros
      </button>
    </div>

    <!-- Active Tags -->
    <div v-if="kanbanStore.filters.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="tag in kanbanStore.filters.tags"
        :key="tag"
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
      >
        {{ tag }}
        <button
          @click="removeTag(tag)"
          type="button"
          class="flex-shrink-0 ml-1.5 inline-flex h-4 w-4 rounded-full items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
        >
          <span class="sr-only">Eliminar etiqueta</span>
          <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
            <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
          </svg>
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useKanbanStore } from '../stores/kanban'

const kanbanStore = useKanbanStore()

const availableUsers = [
  { id: 'u1', name: 'Roman' },
  { id: 'u2', name: 'Valeria' },
  { id: 'u3', name: 'Dayana' },
  { id: 'u4', name: 'Emiliano' }
]

const availableTags = computed(() => {
  const tags = new Set(['Frontend', 'Backend', 'Bug', 'Feature', 'Design'])
  if (kanbanStore.tasks) {
    kanbanStore.tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => tags.add(tag))
      }
    })
  }
  return Array.from(tags).sort()
})

const selectedTag = ref('')

const addTag = () => {
  if (selectedTag.value && !kanbanStore.filters.tags.includes(selectedTag.value)) {
    kanbanStore.filters.tags.push(selectedTag.value)
  }
  selectedTag.value = ''
}

const removeTag = (tag) => {
  kanbanStore.filters.tags = kanbanStore.filters.tags.filter(t => t !== tag)
}

const clearFilters = () => {
  kanbanStore.filters.search = ''
  kanbanStore.filters.priority = ''
  kanbanStore.filters.assignedTo = ''
  kanbanStore.filters.tags = []
}
</script>
