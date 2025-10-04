// Service Worker pour LwebMaker - Recettes PWA

const CACHE_NAME = 'lwebmaker-recettes-v1.0.0';
const API_CACHE_NAME = 'lwebmaker-api-v1.0.0';

// Ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// URLs des API à mettre en cache
const API_URLS_TO_CACHE = [
  '/api/recettes',
  '/api/auth/me'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des ressources statiques');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Erreur lors de la mise en cache:', error);
      })
  );
  
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prend le contrôle immédiatement
  self.clients.claim();
});

// Stratégies de cache pour différents types de requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Stratégie pour les API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Stratégie pour les ressources statiques
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(handleStaticAssets(request));
    return;
  }
  
  // Stratégie pour les pages (navigation)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Stratégie par défaut
  event.respondWith(handleDefault(request));
});

// Gestion des requêtes API (Network First with fallback)
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Tenter d'abord le réseau
    const response = await fetch(request);
    
    if (response.ok) {
      // Mettre en cache la réponse pour certaines API
      if (shouldCacheAPI(request.url)) {
        cache.put(request, response.clone());
      }
      return response;
    }
    
    throw new Error('Réponse réseau non valide');
  } catch (error) {
    console.log('[SW] Réseau indisponible, tentative de récupération du cache pour:', request.url);
    
    // Fallback vers le cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Réponse offline pour les API critiques
    if (request.url.includes('/api/recettes')) {
      return new Response(JSON.stringify({
        message: 'Données hors ligne indisponibles',
        offline: true,
        recettes: []
      }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Gestion des ressources statiques (Cache First)
async function handleStaticAssets(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Impossible de charger la ressource:', request.url);
    throw error;
  }
}

// Gestion de la navigation (Network First with cache fallback)
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Navigation hors ligne, redirection vers la page d\'accueil mise en cache');
    
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Page hors ligne de fallback
    return new Response(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>LwebMaker - Hors ligne</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 2rem; text-align: center; 
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
          }
          .container { max-width: 400px; margin: 0 auto; }
          h1 { color: #ea580c; margin-bottom: 1rem; }
          p { color: #7c2d12; margin-bottom: 2rem; }
          .button { 
            display: inline-block; padding: 0.75rem 1.5rem; 
            background: #ea580c; color: white; text-decoration: none; 
            border-radius: 0.5rem; font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🍳 LwebMaker - Recettes</h1>
          <p>Vous êtes hors ligne. Veuillez vérifier votre connexion internet.</p>
          <a href="/" class="button" onclick="window.location.reload()">Réessayer</a>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Stratégie par défaut (Network First)
async function handleDefault(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Vérifier si une URL d'API doit être mise en cache
function shouldCacheAPI(url) {
  return API_URLS_TO_CACHE.some(apiUrl => url.includes(apiUrl));
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Notification de mise à jour disponible
self.addEventListener('updatefound', () => {
  console.log('[SW] Mise à jour disponible');
});

console.log('[SW] Service Worker LwebMaker - Recettes chargé');