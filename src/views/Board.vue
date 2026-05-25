<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <header class="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
      <div class="flex items-center gap-6">
        <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Software Kanban</h1>
        <button 
          v-if="user && user.role === 'admin'"
          @click="openTaskModal()" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <span>+ Nueva Tarea</span>
        </button>
      </div>
      
      <div v-if="user" class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-sm font-bold text-gray-900 leading-none">{{ user.name }}</p>
          <p class="text-[10px] font-medium text-blue-600 uppercase tracking-wider mt-1">{{ user.role === 'admin' ? 'Administrador' : 'Desarrollador' }}</p>
        </div>
        <div class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
          {{ user.name.charAt(0) }}
        </div>
        <button @click="handleLogout" class="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Cerrar Sesión">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
    </header>

    <!-- Filters Bar -->
    <FiltersBar />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)] items-start">
      <!-- Columnas -->
      <div 
        v-for="col in kanbanStore.columns" 
        :key="col.id" 
        class="flex flex-col bg-gray-200/50 rounded-xl p-3 max-h-full border border-gray-200"
        :data-status="col.id"
      >
        <h2 class="text-sm font-bold mb-4 flex justify-between items-center px-2 text-gray-700 uppercase tracking-widest">
          <div class="flex items-center gap-2">
            {{ col.title }}
            <span 
              v-if="col.wipLimit > 0" 
              class="text-[10px] font-medium px-1.5 py-0.5 rounded border"
              :class="isWipLimitReached(col) ? 'bg-red-100 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-100'"
            >
              WIP: {{ col.wipLimit }}
            </span>
          </div>
          <span class="bg-white/50 text-gray-600 text-[10px] px-2 py-0.5 rounded-full border border-gray-300">
            {{ kanbanStore.getTasksByStatus(col.id).length }}
          </span>
        </h2>

        <draggable
          class="flex-1 overflow-y-auto min-h-[100px] space-y-3 p-1 custom-scrollbar"
          v-model="columnTasksMap[col.id].value"
          group="tasks"
          :move="checkMove"
          item-key="id"
          ghost-class="opacity-0"
          drag-class="rotate-2 shadow-2xl scale-105"
          :data-status="col.id"
        >
          <template #item="{ element }">
            <TaskCard :task="element" @click="openTaskModal(element)" />
          </template>
        </draggable>
      </div>
    </div>

    <!-- Task Modal -->
    <TaskModal 
      :is-open="isModalOpen" 
      :task="selectedTask" 
      @close="closeTaskModal" 
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import draggable from 'vuedraggable';
import { useAuth } from '../composables/useAuth';
import { useRouter } from 'vue-router';
import { useKanbanStore } from '../stores/kanban';

// Components
import FiltersBar from '../components/FiltersBar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskModal from '../components/TaskModal.vue';

const { user, logout } = useAuth();
const router = useRouter();
const kanbanStore = useKanbanStore();

// Modal State
const isModalOpen = ref(false);
const selectedTask = ref(null);

const openTaskModal = (task = null) => {
  selectedTask.value = task;
  isModalOpen.value = true;
};

const closeTaskModal = () => {
  isModalOpen.value = false;
  selectedTask.value = null;
};

const handleLogout = () => {
  logout();
  router.push('/login');
};

const isWipLimitReached = (column) => {
  if (column.wipLimit === 0) return false;
  return kanbanStore.getTasksByStatus(column.id).length >= column.wipLimit;
};

// Crear un mapeo reactivo de cada columna a una propiedad computada escribible
const columnTasksMap = {};
for (const col of kanbanStore.columns) {
  columnTasksMap[col.id] = computed({
    get: () => kanbanStore.getTasksByStatus(col.id),
    set: (newVal) => {
      kanbanStore.updateColumnTasks(col.id, newVal, user.value);
    }
  });
}

/**
 * BUSINESS RULES
 */
const checkMove = (evt) => {
  if (!user.value) return false;
  const task = evt.draggedContext.element;
  const targetStatus = evt.to.dataset.status;
  const oldStatus = task.status;
  
  // Admin can move everything, but still respect WIP limits
  if (user.value.role === 'admin') {
    return kanbanStore.canMoveTo(targetStatus, task.id);
  }
  
  // Dev can only move tasks assigned to them
  if (task.assignedTo && task.assignedTo.length > 0 && !task.assignedTo.includes(user.value.uid)) {
    return false;
  }

  // Si se mueve dentro de la misma columna (reordenamiento interno)
  if (oldStatus === targetStatus) {
    return true;
  }

  // Dev transition rules
  const validTransition = 
    (oldStatus === 'todo' && targetStatus === 'in_progress') ||
    (oldStatus === 'in_progress' && targetStatus === 'review');

  if (!validTransition || targetStatus === 'done') {
    return false;
  }

  // WIP Limit check
  return kanbanStore.canMoveTo(targetStatus, task.id);
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
