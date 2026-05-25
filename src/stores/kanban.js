import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useKanbanStore = defineStore('kanban', () => {
  const tasks = ref([])
  const columns = ref([
    { id: 'todo', title: 'Por Hacer', wipLimit: 0 },
    { id: 'in_progress', title: 'En Progreso', wipLimit: 3 },
    { id: 'review', title: 'Revisión', wipLimit: 0 },
    { id: 'done', title: 'Hecho', wipLimit: 0 }
  ])
  
  const filters = ref({
    search: '',
    priority: '',
    assignedTo: '',
    tags: []
  })

  // Persistence
  const savedTasks = localStorage.getItem('kanban_tasks')
  if (savedTasks) {
    try {
      tasks.value = JSON.parse(savedTasks)
    } catch (e) {
      console.error('Failed to parse tasks from localStorage', e)
      tasks.value = []
    }
  }

  const savedColumns = localStorage.getItem('kanban_columns')
  if (savedColumns) {
    try {
      columns.value = JSON.parse(savedColumns)
    } catch (e) {
      console.error('Failed to parse columns from localStorage', e)
    }
  }

  watch(tasks, (newTasks) => {
    localStorage.setItem('kanban_tasks', JSON.stringify(newTasks))
  }, { deep: true })

  watch(columns, (newColumns) => {
    localStorage.setItem('kanban_columns', JSON.stringify(newColumns))
  }, { deep: true })

  // Getters
  const filteredTasks = computed(() => {
    return tasks.value.filter(task => {
      const matchesSearch = !filters.value.search || 
                            task.title.toLowerCase().includes(filters.value.search.toLowerCase()) ||
                            task.description.toLowerCase().includes(filters.value.search.toLowerCase())
      
      const matchesPriority = !filters.value.priority || task.priority === filters.value.priority
      
      const matchesAssigned = !filters.value.assignedTo || 
                              (task.assignedTo && task.assignedTo.includes(filters.value.assignedTo))
      
      const matchesTags = !filters.value.tags || filters.value.tags.length === 0 || 
                          (task.tags && filters.value.tags.every(tag => task.tags.includes(tag)))
      
      return matchesSearch && matchesPriority && matchesAssigned && matchesTags
    })
  })

  const getTasksByStatus = (status) => {
    return filteredTasks.value.filter(task => task.status === status)
  }

  const canMoveTo = (status, taskId = null) => {
    const column = columns.value.find(c => c.id === status)
    if (!column || column.wipLimit === 0) return true
    
    const currentTasksInColumn = tasks.value.filter(t => t.status === status)
    
    // If we are moving a task that is already in this column, it doesn't count towards the limit increase
    const isAlreadyInColumn = taskId && currentTasksInColumn.some(t => t.id === taskId)
    if (isAlreadyInColumn) return true

    return currentTasksInColumn.length < column.wipLimit
  }

  // Actions
  const addTask = (taskData) => {
    const newTask = {
      id: crypto.randomUUID(),
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      estimation: taskData.estimation || 0,
      tags: taskData.tags || [],
      dueDate: taskData.dueDate || null,
      subtasks: taskData.subtasks || [],
      assignedTo: taskData.assignedTo || [],
      assignedNames: taskData.assignedNames || [],
      comments: [],
      activity: [{
        id: crypto.randomUUID(),
        userId: taskData.creatorId,
        type: 'created',
        text: 'Task created',
        createdAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    tasks.value.push(newTask)
    return newTask
  }

  const updateTask = (taskId, updates) => {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      tasks.value[index] = {
        ...tasks.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  const deleteTask = (taskId) => {
    tasks.value = tasks.value.filter(t => t.id !== taskId)
  }

  const moveTask = (taskId, newStatus, userId = null) => {
    if (canMoveTo(newStatus, taskId)) {
      const task = tasks.value.find(t => t.id === taskId)
      const oldStatus = task ? task.status : 'unknown'
      
      updateTask(taskId, { status: newStatus })
      
      if (oldStatus !== newStatus) {
        addActivity(taskId, {
          userId,
          type: 'move',
          text: `Moved from ${oldStatus} to ${newStatus}`
        })
      }
      return true
    }
    return false
  }

  const addComment = (taskId, { userId, userName, text }) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.comments.push({
        id: crypto.randomUUID(),
        userId,
        userName,
        text,
        createdAt: new Date().toISOString()
      })
      addActivity(taskId, {
        userId,
        type: 'comment',
        text: `Added a comment: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`
      })
    }
  }

  const addActivity = (taskId, { userId, type, text }) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      if (!task.activity) task.activity = []
      task.activity.unshift({
        id: crypto.randomUUID(),
        userId,
        type,
        text,
        createdAt: new Date().toISOString()
      })
    }
  }

  return {
    tasks,
    columns,
    filters,
    filteredTasks,
    getTasksByStatus,
    canMoveTo,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addComment,
    addActivity
  }
})
