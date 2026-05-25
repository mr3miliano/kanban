import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // CORS Headers
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    // GET: Obtener tareas
    if (request.method === 'GET') {
      const tasks = await kv.get('kanban_tasks');
      return response.status(200).json(tasks || []);
    }

    // POST: Guardar tareas
    if (request.method === 'POST') {
      const tasks = request.body;
      if (!Array.isArray(tasks)) {
        return response.status(400).json({ error: 'El cuerpo de la petición debe ser un arreglo de tareas.' });
      }
      await kv.set('kanban_tasks', tasks);
      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: `Método ${request.method} no permitido.` });
  } catch (error) {
    console.error('Vercel KV Error:', error);
    return response.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
}
