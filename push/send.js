// Envía el aviso a cada teléfono guardado en subscriptions.json.
// Lo corre GitHub Actions 3 veces al día (ver .github/workflows/avisos.yml).
import webpush from "web-push";
import { readFileSync } from "node:fs";

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SLOT } = process.env;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) { console.error("Faltan las llaves VAPID en los secrets del repo."); process.exit(1); }
webpush.setVapidDetails("https://github.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const MESSAGES = {
  mediodia: { title: "¿Cómo va el día? 🌴", body: "Anota lo que gastaste en la mañana o el almuerzo. Toma 5 segundos." },
  tarde:    { title: "Check de la tarde 💸", body: "¿Café, Uber, algo en campus? Anótalo ahora que te acuerdas." },
  noche:    { title: "Cierre del día ✨", body: "Último aviso de hoy: anota tus gastos o marca \"Hoy no gasté nada\"." },
};
function slotFromClock() {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return h < 16 ? "mediodia" : h < 20 ? "tarde" : "noche";
}
const msg = MESSAGES[SLOT] || MESSAGES[slotFromClock()];
const subs = JSON.parse(readFileSync(new URL("./subscriptions.json", import.meta.url)));
if (!subs.length) { console.log("Todavía no hay teléfonos registrados."); process.exit(0); }

let ok = 0;
for (const s of subs) {
  try { await webpush.sendNotification(s, JSON.stringify(msg), { TTL: 3 * 3600 }); ok++; }
  catch (e) { console.error("No se pudo enviar a un teléfono:", e.statusCode, e.body || e.message); }
}
console.log(`Enviado a ${ok} de ${subs.length}.`);
if (!ok) process.exit(1);
