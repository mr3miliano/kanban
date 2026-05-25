<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar Sesión
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Usa tu usuario y contraseña (usuario+rol)
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">Usuario</label>
            <input v-model="username" id="username" name="username" type="text" required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Usuario (ej: roman, emiliano)">
          </div>
          <div>
            <label for="password" class="sr-only">Contraseña</label>
            <input v-model="password" id="password" name="password" type="password" required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña (usuario+rol)">
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center font-medium">
          {{ error }}
        </div>

        <div>
          <button type="submit" :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
            {{ loading ? 'Ingresando...' : 'Entrar' }}
          </button>
        </div>

        <div class="mt-4 p-4 bg-blue-50 rounded-lg text-xs text-blue-800">
          <p class="font-bold mb-1">Cuentas disponibles:</p>
          <ul class="list-disc list-inside space-y-1">
            <li>roman / romandeveloper</li>
            <li>valeria / valeriadeveloper</li>
            <li>dayana / dayanadeveloper</li>
            <li>emiliano / emilianoadmin</li>
          </ul>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const { login } = useAuth();

const handleLogin = () => {
  loading.value = true;
  error.value = '';
  
  const result = login(username.value, password.value);
  
  if (result.success) {
    router.push('/');
  } else {
    error.value = result.message;
  }
  
  loading.value = false;
};
</script>
