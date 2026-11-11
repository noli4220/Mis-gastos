// Mis gastos: funciona sin internet y muestra los avisos.
const CACHE = "misgastos-v3";
const ESTADO = "misgastos-estado";   // resumen que deja la app para los avisos
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== ESTADO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Red primero (para recibir mejoras), y si no hay internet, la copia guardada.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});

// Agrega al aviso cuánto queda esta semana, con el resumen que guardó la app en este teléfono.
const plata = n => "$" + Math.abs(n).toFixed(2);
async function extra() {
  try {
    const r = await (await caches.open(ESTADO)).match("estado.json");
    if (!r) return null;
    const s = await r.json(), d = new Date(), p = n => String(n).padStart(2, "0");
    const hoy = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
    let queda = "";
    if (hoy <= s.weekEnd) queda = s.weekLeft >= 0 ? "Te quedan " + plata(s.weekLeft) + " esta semana." : "Te pasaste por " + plata(s.weekLeft) + " esta semana.";
    else if (hoy <= s.cycleEnd) queda = s.monthLeft >= 0 ? "Te quedan " + plata(s.monthLeft) + " este mes." : "Te pasaste por " + plata(s.monthLeft) + " este mes.";
    return { queda, anotado: s.date === hoy && !!s.logged };
  } catch (_) { return null; }
}
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(extra().then(x => {
    let body = d.body || "¿Ya anotaste tus gastos?";
    if (x && !d.fijo && !/activados/i.test(d.title || "")) {
      if (x.anotado) body = "Hoy ya anotaste ✓ Si gastaste algo más, agrégalo.";
      if (x.queda) body += " " + x.queda;
    }
    return self.registration.showNotification(d.title || "Mis gastos", {
      body,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      tag: "recordatorio",
      data: { url: "./" }
    });
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ("focus" in w) return w.focus(); }
    return self.clients.openWindow("./");
  }));
});
