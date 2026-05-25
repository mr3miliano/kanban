<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const priorityClasses = computed(() => {
  switch (props.task.priority?.toLowerCase()) {
    case 'low': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'medium': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'urgent': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
})

const subtasksProgress = computed(() => {
  if (!props.task.subtasks || props.task.subtasks.length === 0) return null
  const completed = props.task.subtasks.filter(s => s.completed).length
  return `${completed}/${props.task.subtasks.length}`
})

const isOverdue = computed(() => {
  if (!props.task.dueDate || props.task.status === 'done') return false
  return new Date(props.task.dueDate) < new Date()
})

const isNearDue = computed(() => {
  if (!props.task.dueDate || isOverdue.value || props.task.status === 'done') return false
  const dueDate = new Date(props.task.dueDate)
  const now = new Date()
  const diff = dueDate - now
  const days = diff / (1000 * 60 * 60 * 24)
  return days <= 2
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

const handleCardClick = () => {
  emit('click', props.task)
}
</script>

<template>
  <div 
    @click="handleCardClick"
    class="bg-white p-3.5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group relative overflow-hidden"
  >
    <!-- Priority indicator line -->
    <div 
      class="absolute top-0 left-0 w-1 h-full"
      :class="{
        'bg-slate-300': task.priority === 'low',
        'bg-blue-400': task.priority === 'medium',
        'bg-orange-400': task.priority === 'high',
        'bg-red-500': task.priority === 'urgent'
      }"
    ></div>

    <!-- Header: Priority and Estimation -->
    <div class="flex justify-between items-start mb-2.5">
      <span 
        class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border"
        :class="priorityClasses"
      >
        {{ task.priority }}
      </span>
      <div class="flex items-center gap-2">
        <span v-if="task.estimation" class="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
          {{ task.estimation }} SP
        </span>
      </div>
    </div>

    <!-- Title -->
    <h3 class="text-sm font-bold text-gray-800 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
      {{ task.title }}
    </h3>

    <!-- Description -->
    <p v-if="task.description" class="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
      {{ task.description }}
    </p>

    <!-- Tags -->
    <div v-if="task.tags && task.tags.length > 0" class="flex flex-wrap gap-1.5 mb-4">
      <span 
        v-for="tag in task.tags" 
        :key="tag"
        class="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Footer: Date, Subtasks, Assignees -->
    <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
      <div class="flex items-center gap-3">
        <!-- Due Date -->
        <div 
          v-if="task.dueDate" 
          class="flex items-center gap-1 text-[10px] font-bold"
          :class="{
            'text-red-600': isOverdue,
            'text-orange-600': isNearDue,
            'text-gray-400': !isOverdue && !isNearDue
          }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ formatDate(task.dueDate) }}
        </div>

        <!-- Subtasks -->
        <div v-if="subtasksProgress" class="flex items-center gap-1 text-[10px] font-bold text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {{ subtasksProgress }}
        </div>
      </div>

      <!-- Assignees -->
      <div class="flex -space-x-1.5 overflow-hidden">
        <template v-if="task.assignedNames && task.assignedNames.length > 0">
          <div 
            v-for="(name, index) in task.assignedNames.slice(0, 3)" 
            :key="index"
            class="inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-gradient-to-br from-blue-500 to-indigo-600 text-[9px] font-bold text-white shadow-sm"
            :title="name"
          >
            {{ getInitials(name) }}
          </div>
          <div v-if="task.assignedNames.length > 3" class="inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 text-[9px] font-bold text-gray-500 shadow-sm">
            +{{ task.assignedNames.length - 3 }}
          </div>
        </template>
        <div v-else class="h-6 w-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>
