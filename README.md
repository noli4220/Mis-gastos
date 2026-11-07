# Mis gastos

App para anotar los gastos de cada día con un presupuesto de $115 por semana (lunes a domingo). Lo que sobra pasa a la semana siguiente.

- **Instalar en iPhone:** abre el link de GitHub Pages en Safari → Compartir → Agregar a pantalla de inicio.
- **Avisos:** abre la app desde el ícono → "Activar avisos" → manda el código a Claude para agregarlo a `push/subscriptions.json`.
- Los avisos los manda `.github/workflows/avisos.yml` a la 1:00 pm, 6:00 pm y 9:30 pm (hora de Miami). GitHub a veces los retrasa unos minutos.
- En marzo, con el cambio de hora, hay que restar 1 a las horas UTC del workflow.
- Los gastos se guardan solo en el teléfono. Usa "Copia de seguridad" en la app antes de borrarla.
