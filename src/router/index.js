import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Board',
    component: () => import('../views/Board.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const { user, initAuth } = useAuth();
  
  // Inicializar auth si no se ha hecho
  if (user.value === null) {
    initAuth();
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isGuest = to.matched.some(record => record.meta.guest);

  if (requiresAuth && !user.value) {
    next('/login');
  } else if (isGuest && user.value) {
    next('/');
  } else {
    next();
  }
});

export default router;
