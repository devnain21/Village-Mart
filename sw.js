const CACHE_NAME = 'village-mart-v2'
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
]

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Village Mart - ऑफलाइन</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0fdf4;color:#166534;text-align:center;padding:24px}
    .box{max-width:360px}
    .icon{font-size:64px;margin-bottom:16px}
    h1{font-size:24px;margin-bottom:8px}
    p{font-size:14px;color:#4b5563;margin-bottom:20px}
    button{background:#16a34a;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer}
    button:active{transform:scale(0.95)}
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">📡</div>
    <h1>इंटरनेट कनेक्शन नहीं है</h1>
    <p>कृपया अपना इंटरनेट चेक करें और दोबारा कोशिश करें।</p>
    <button onclick="location.reload()">दोबारा कोशिश करें</button>
  </div>
</body>
</html>`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  // For navigation requests, serve offline page on failure
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() =>
          caches.match(event.request).then(cached =>
            cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html' } })
          )
        )
    )
    return
  }

  // For other requests, cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => cached)

      return cached || fetchPromise
    })
  )
})
