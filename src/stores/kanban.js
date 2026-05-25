import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db, isFirebaseConfigured } from '../firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

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

  // Persistence using Firebase Firestore with LocalStorage fallback
  let isUpdatingFromFirebase = false

  const initFirebaseSync = () => {
    if (!isFirebaseConfigured) {
      // Fallback a localStorage si Firebase no está configurado
      const savedTasks = localStorage.getItem('kanban_tasks')
      if (savedTasks) {
        try {
          tasks.value = JSON.parse(savedTasks)
        } catch (e) {
          console.error('Failed to parse tasks from localStorage', e)
        }
      }
      return
    }

    // Escuchar cambios del documento en tiempo real
    onSnapshot(doc(db, 'kanban', 'data'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        
        // Evitamos que al actualizar reactivamente el estado local
        // se dispare el watcher que guarda en Firebase
        isUpdatingFromFirebase = true
        
        if (data.tasks) {
          tasks.value = data.tasks
        }
        if (data.columns) {
          columns.value = data.columns
        }
        
        isUpdatingFromFirebase = false
      } else {
        // Inicializar documento en Firestore si no existe
        saveTasksToFirebase(tasks.value)
      }
    }, (error) => {
      console.error('Error al sincronizar desde Firebase Firestore:', error)
    })
  }

  const savedColumns = localStorage.getItem('kanban_columns')
  if (savedColumns) {
    try {
      columns.value = JSON.parse(savedColumns)
    } catch (e) {
      console.error('Failed to parse columns from localStorage', e)
    }
  }

  let saveTimeout = null
  const saveTasksToFirebase = (newTasks) => {
    // 1. Guardar en localStorage inmediatamente (local offline quick save)
    localStorage.setItem('kanban_tasks', JSON.stringify(newTasks))

    // 2. Si Firebase no está configurado o el cambio viene de la suscripción, no hacemos nada más
    if (!isFirebaseConfigured || isUpdatingFromFirebase) return

    // 3. Guardar asíncronamente en Firebase Firestore con de-bounce de 1s
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'kanban', 'data'), {
          tasks: newTasks,
          columns: columns.value
        }, { merge: true })
      } catch (e) {
        console.error('Failed to save tasks to Firebase Firestore:', e)
      }
    }, 1000)
  }

  watch(tasks, (newTasks) => {
    saveTasksToFirebase(newTasks)
  }, { deep: true })

  watch(columns, (newColumns) => {
    localStorage.setItem('kanban_columns', JSON.stringify(newColumns))
    if (isFirebaseConfigured && !isUpdatingFromFirebase) {
      saveTasksToFirebase(tasks.value)
    }
  }, { deep: true })

  // Carga inicial y suscripción a Firebase
  initFirebaseSync()

  // Helper to check if task matches current filters
  const matchesFilters = (task) => {
    const matchesSearch = !filters.value.search || 
                          task.title.toLowerCase().includes(filters.value.search.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(filters.value.search.toLowerCase()))
    
    const matchesPriority = !filters.value.priority || task.priority === filters.value.priority
    
    const matchesAssigned = !filters.value.assignedTo || 
                            (task.assignedTo && task.assignedTo.includes(filters.value.assignedTo))
    
    const matchesTags = !filters.value.tags || filters.value.tags.length === 0 || 
                        (task.tags && filters.value.tags.every(tag => task.tags.includes(tag)))
    
    return matchesSearch && matchesPriority && matchesAssigned && matchesTags
  }

  // Getters
  const filteredTasks = computed(() => {
    return tasks.value.filter(matchesFilters)
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

  const updateColumnTasks = (status, newTasks, currentUser = null) => {
    // 1. Obtener todas las tareas de la columna actual en el store
    const columnTasks = tasks.value.filter(t => t.status === status)
    
    // 2. Identificar qué tareas son visibles en el nuevo listado (newTasks)
    const visibleIds = new Set(newTasks.map(t => t.id))
    
    // 3. Conservar las tareas de esta columna que NO están visibles y NO coinciden con los filtros (verdaderamente filtradas)
    const hiddenTasks = columnTasks.filter(t => !visibleIds.has(t.id) && !matchesFilters(t))
    
    // 4. Procesar las nuevas tareas para actualizar su estado, añadir logs de actividad y auto-asignación si aplica
    const processedNewTasks = newTasks.map(t => {
      if (t.status !== status) {
        const oldStatus = t.status
        const updatedTask = {
          ...t,
          status,
          updatedAt: new Date().toISOString()
        }
        
        // Registrar la actividad de movimiento
        if (!updatedTask.activity) updatedTask.activity = []
        updatedTask.activity.unshift({
          id: crypto.randomUUID(),
          userId: currentUser?.uid || null,
          type: 'move',
          text: `Moved from ${oldStatus} to ${status}`,
          createdAt: new Date().toISOString()
        })
        
        // Regla de auto-asignación para desarrolladores cuando mueven a in_progress
        if (currentUser?.role === 'developer' && status === 'in_progress' && (!updatedTask.assignedTo || updatedTask.assignedTo.length === 0)) {
          updatedTask.assignedTo = [currentUser.uid]
          updatedTask.assignedNames = [currentUser.name]
        }
        
        return updatedTask
      }
      return t
    })
    
    // 5. Obtener todas las tareas de OTRAS columnas, descartando aquellas que fueron movidas a esta columna
    // (para evitar duplicados antes de que sus setters se ejecuten)
    const otherColumnsTasks = tasks.value.filter(t => t.status !== status && !visibleIds.has(t.id))
    
    // 6. Actualizar el store de tareas reconstruyendo el array plano
    tasks.value = [...otherColumnsTasks, ...hiddenTasks, ...processedNewTasks]
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
    updateColumnTasks,
    addComment,
    addActivity,
    initFirebaseSync
  }
})
