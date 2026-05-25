<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useKanbanStore } from '../stores/kanban'
import { useAuth, USERS } from '../composables/useAuth'

const props = defineProps({
  isOpen: Boolean,
  task: {
    type: Object,
    default: null
  },
  initialStatus: {
    type: String,
    default: 'todo'
  }
})

const emit = defineEmits(['close'])

const store = useKanbanStore()
const { user } = useAuth()

const isNewTask = computed(() => !props.task)

// Local state for the form
const form = ref({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  estimation: 0,
  dueDate: '',
  tags: [],
  subtasks: [],
  assignedTo: []
})

const newSubtask = ref('')
const newTag = ref('')
const newComment = ref('')

// Initialize form when modal opens or task changes
const initForm = () => {
  if (props.task) {
    form.value = {
      title: props.task.title,
      description: props.task.description,
      status: props.task.status,
      priority: props.task.priority,
      estimation: props.task.estimation,
      dueDate: props.task.dueDate || '',
      tags: [...(props.task.tags || [])],
      subtasks: [...(props.task.subtasks || [])].map(s => ({ ...s })),
      assignedTo: [...(props.task.assignedTo || [])]
    }
  } else {
    form.value = {
      title: '',
      description: '',
      status: props.initialStatus,
      priority: 'medium',
      estimation: 0,
      dueDate: '',
      tags: [],
      subtasks: [],
      assignedTo: []
    }
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    initForm()
  }
})

watch(() => props.task, () => {
  if (props.isOpen) {
    initForm()
  }
}, { deep: true })

const handleClose = () => {
  emit('close')
}

const saveTask = () => {
  if (!form.value.title.trim()) return

  const taskData = {
    ...form.value,
    creatorId: user.value?.uid,
    assignedNames: USERS.filter(u => form.value.assignedTo.includes(u.uid)).map(u => u.name)
  }

  if (isNewTask.value) {
    store.addTask(taskData)
  } else {
    // Check for status change to log activity
    if (form.value.status !== props.task.status) {
      store.addActivity(props.task.id, {
        userId: user.value?.uid,
        type: 'move',
        text: `Moved from ${props.task.status} to ${form.value.status}`
      })
    }
    store.updateTask(props.task.id, taskData)
  }
  handleClose()
}

const deleteTask = () => {
  if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
    store.deleteTask(props.task.id)
    handleClose()
  }
}

// Subtasks
const addSubtask = () => {
  if (!newSubtask.value.trim()) return
  form.value.subtasks.push({
    id: crypto.randomUUID(),
    text: newSubtask.value.trim(),
    completed: false
  })
  newSubtask.value = ''
}

const toggleSubtask = (subtask) => {
  subtask.completed = !subtask.completed
}

const removeSubtask = (id) => {
  form.value.subtasks = form.value.subtasks.filter(s => s.id !== id)
}

// Tags
const addTag = () => {
  const tag = newTag.value.trim().toLowerCase()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  newTag.value = ''
}

const removeTag = (tag) => {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

// Comments
const submitComment = () => {
  if (!newComment.value.trim() || isNewTask.value) return
  store.addComment(props.task.id, {
    userId: user.value?.uid,
    userName: user.value?.name,
    text: newComment.value.trim()
  })
  newComment.value = ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

const getPriorityClass = (priority) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-blue-100 text-blue-800'
    case 'low': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const isAdmin = computed(() => user.value?.role === 'admin')
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
        <div class="flex-1 mr-4">
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="Título de la tarea"
            class="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-gray-400"
          />
        </div>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Main Content -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Description -->
            <section>
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Descripción
              </h3>
              <textarea 
                v-model="form.description" 
                rows="4" 
                placeholder="Añade una descripción más detallada..."
                class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              ></textarea>
            </section>

            <!-- Subtasks -->
            <section>
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Subtareas
              </h3>
              <div class="space-y-2 mb-3">
                <div v-for="subtask in form.subtasks" :key="subtask.id" class="flex items-center group">
                  <input 
                    type="checkbox" 
                    :checked="subtask.completed" 
                    @change="toggleSubtask(subtask)"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span :class="['ml-3 text-sm flex-1', subtask.completed ? 'line-through text-gray-400' : 'text-gray-700']">
                    {{ subtask.text }}
                  </span>
                  <button @click="removeSubtask(subtask.id)" class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="flex">
                <input 
                  v-model="newSubtask" 
                  type="text" 
                  placeholder="Añadir una subtarea..."
                  @keyup.enter="addSubtask"
                  class="flex-1 rounded-l-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
                <button 
                  @click="addSubtask"
                  class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-r-lg border border-l-0 border-gray-300 text-sm font-medium transition-colors"
                >
                  Añadir
                </button>
              </div>
            </section>

            <!-- Comments (Only for existing tasks) -->
            <section v-if="!isNewTask">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Comentarios
              </h3>
              
              <div class="space-y-4 mb-6">
                <div v-for="comment in task.comments" :key="comment.id" class="flex space-x-3">
                  <div class="flex-shrink-0">
                    <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      {{ comment.userName.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="flex-1 bg-gray-50 rounded-lg px-4 py-2">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-bold text-gray-900">{{ comment.userName }}</span>
                      <span class="text-[10px] text-gray-500">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <p class="text-sm text-gray-700">{{ comment.text }}</p>
                  </div>
                </div>
              </div>

              <div class="flex space-x-3">
                <div class="flex-shrink-0">
                  <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {{ user?.name.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="flex-1">
                  <textarea 
                    v-model="newComment" 
                    rows="2" 
                    placeholder="Escribe un comentario..."
                    class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  ></textarea>
                  <div class="mt-2 flex justify-end">
                    <button 
                      @click="submitComment"
                      :disabled="!newComment.trim()"
                      class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Activity Log (Only for existing tasks) -->
            <section v-if="!isNewTask">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Actividad
              </h3>
              <div class="space-y-3 border-l-2 border-gray-100 ml-4 pl-6">
                <div v-for="item in task.activity" :key="item.id" class="relative">
                  <div class="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-white border-2 border-gray-300"></div>
                  <p class="text-xs text-gray-600">
                    <span class="font-semibold text-gray-900">
                      {{ USERS.find(u => u.uid === item.userId)?.name || 'Usuario' }}
                    </span>
                    {{ item.text }}
                  </p>
                  <p class="text-[10px] text-gray-400">{{ formatDate(item.createdAt) }}</p>
                </div>
              </div>
            </section>
          </div>

          <!-- Right Column: Metadata -->
          <div class="space-y-6">
            <!-- Status -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Estado</label>
              <select 
                v-model="form.status"
                class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option v-for="col in store.columns" :key="col.id" :value="col.id">
                  {{ col.title }}
                </option>
              </select>
            </div>

            <!-- Priority -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Prioridad</label>
              <select 
                v-model="form.priority"
                class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <!-- Estimation -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Estimación (puntos)</label>
              <input 
                v-model.number="form.estimation" 
                type="number" 
                min="0"
                class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>

            <!-- Due Date -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha de Entrega</label>
              <input 
                v-model="form.dueDate" 
                type="date" 
                class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>

            <!-- Assignees -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Asignado a</label>
              <div class="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                <label v-for="u in USERS" :key="u.uid" class="flex items-center">
                  <input 
                    type="checkbox" 
                    :value="u.uid" 
                    v-model="form.assignedTo"
                    :disabled="!isAdmin && u.uid !== user?.uid"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700">{{ u.name }}</span>
                </label>
              </div>
              <p v-if="!isAdmin" class="mt-1 text-[10px] text-gray-400">Solo administradores pueden asignar a otros.</p>
            </div>

            <!-- Tags -->
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Etiquetas</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <span 
                  v-for="tag in form.tags" 
                  :key="tag"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {{ tag }}
                  <button @click="removeTag(tag)" class="ml-1 text-indigo-400 hover:text-indigo-600">
                    <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </span>
              </div>
              <div class="flex">
                <input 
                  v-model="newTag" 
                  type="text" 
                  placeholder="Nueva etiqueta..."
                  @keyup.enter="addTag"
                  class="flex-1 rounded-l-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
                <button 
                  @click="addTag"
                  class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-r-lg border border-l-0 border-gray-300 text-sm font-medium transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
        <div>
          <button 
            v-if="!isNewTask && isAdmin"
            @click="deleteTask"
            class="text-red-600 hover:text-red-800 text-sm font-medium flex items-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar Tarea
          </button>
        </div>
        <div class="flex space-x-3">
          <button 
            @click="handleClose"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="saveTask"
            class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
          >
            {{ isNewTask ? 'Crear Tarea' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for the modal body */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 3px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
