import { ref, onMounted } from 'vue';

const currentUser = ref(null);
const loading = ref(true);

// Usuarios predefinidos
export const USERS = [
  { uid: 'u1', name: 'Roman', username: 'roman', role: 'developer', password: 'romandeveloper' },
  { uid: 'u2', name: 'Valeria', username: 'valeria', role: 'developer', password: 'valeriadeveloper' },
  { uid: 'u3', name: 'Dayana', username: 'dayana', role: 'developer', password: 'dayanadeveloper' },
  { uid: 'u4', name: 'Emiliano', username: 'emiliano', role: 'admin', password: 'emilianoadmin' }
];

export function useAuth() {
  const initAuth = () => {
    const savedUser = localStorage.getItem('kanban_user');
    if (savedUser) {
      currentUser.value = JSON.parse(savedUser);
    }
    loading.value = false;
  };

  const login = (username, password) => {
    const user = USERS.find(u => u.username === username.toLowerCase() && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPass } = user;
      currentUser.value = userWithoutPass;
      localStorage.setItem('kanban_user', JSON.stringify(userWithoutPass));
      return { success: true };
    }
    return { success: false, message: 'Usuario o contraseña incorrectos' };
  };

  const logout = () => {
    currentUser.value = null;
    localStorage.removeItem('kanban_user');
  };

  return {
    user: currentUser,
    loading,
    initAuth,
    login,
    logout
  };
}
