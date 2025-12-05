// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// DEBUG: registrar peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Datos en memoria (si quieres persistir, lee/escribe data/reservas.json)
let reservations = [];
let nextId = 1;

// Si quieres precargar desde data/reservas.json en el arranque (opcional)
const DATA_FILE = path.join(__dirname, 'data', 'reservas.json');
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      reservations = arr.map(r => ({ ...r }));
      // nextId = max id + 1
      const maxId = reservations.reduce((m, r) => Math.max(m, r.id || 0), 0);
      nextId = maxId + 1;
      console.log(`Cargadas ${reservations.length} reservas desde data/reservas.json (nextId=${nextId})`);
    }
  } catch (err) {
    console.log('Error leyendo data/reservas.json:', err.message);
  }
}

// Utilidad: validar fecha/hora futura
function isFutureDate(dateString, timeString) {
  const reservationDateTime = new Date(`${dateString}T${timeString}:00`);
  const currentDateTime = new Date();
  return reservationDateTime > currentDateTime;
}

// Utilidad opcional: guardar en archivo (si quieres persistir)
function persistToFile() {
  try {
    if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
    fs.writeFileSync(DATA_FILE, JSON.stringify(reservations, null, 2), 'utf8');
    console.log('Reservas guardadas en data/reservas.json');
  } catch (err) {
    console.log('Error guardando archivo:', err.message);
  }
}

// LISTAR (index.ejs)
app.get('/', (req, res) => {
  const sortedReservations = [...reservations].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}:00`);
    const dateB = new Date(`${b.date}T${b.time}:00`);
    return dateA - dateB;
  });

  res.render('index', {
    reservations: sortedReservations,
    error: req.query.error || null,
    minDate: new Date().toISOString().split('T')[0]
  });
});

// CREATE (POST /reservas)
app.post('/reservas', (req, res) => {
  const { clientName, date, time, guests, notes, celular } = req.body;
  let errorMessage = null;

  if (!clientName || clientName.trim() === '') {
    errorMessage = '¡Error! El nombre del cliente no puede ser vacío.';
  } else if (!celular || celular.trim() === '') {
    errorMessage = '¡Error! El teléfono celular no puede estar vacío.';
  } else if (!isFutureDate(date, time)) {
    errorMessage = '¡Error! La reserva debe ser en una fecha y hora futura.';
  }

  if (errorMessage) {
    return res.redirect(`/?error=${encodeURIComponent(errorMessage)}`);
  }

  const newReservation = {
    id: nextId++,
    clientName,
    date,
    time,
    guests: parseInt(guests) || 1,
    notes: notes || '',
    celular: celular || ''
  };

  reservations.push(newReservation);

  // opcional: persistir
  // persistToFile();

  res.redirect('/');
});

// GET editar (muestra views/edit.ejs)
app.get('/reservas/editar/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const reservationToEdit = reservations.find(r => r.id === id);

  if (!reservationToEdit) {
    return res.redirect(`/?error=${encodeURIComponent('Reserva no encontrada con id ' + id)}`);
  }

  res.render('edit', {
    reservation: reservationToEdit,
    error: req.query.error || null,
    minDate: new Date().toISOString().split('T')[0]
  });
});

// POST editar (actualiza)
app.post('/reservas/editar/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { clientName, date, time, guests, notes, celular } = req.body;

  const reservationIndex = reservations.findIndex(r => r.id === id);
  if (reservationIndex === -1) {
    return res.redirect(`/?error=${encodeURIComponent('Reserva no encontrada al intentar editar.')}`);
  }

  const existing = reservations[reservationIndex];

  if (!clientName || clientName.trim() === '') {
    return res.redirect(`/reservas/editar/${id}?error=${encodeURIComponent('¡Error al editar! El nombre del cliente no puede ser vacío.')}`);
  }
  if (!celular || celular.trim() === '') {
    return res.redirect(`/reservas/editar/${id}?error=${encodeURIComponent('¡Error al editar! El teléfono celular no puede estar vacío.')}`);
  }

  // Manejo flexible de fecha/hora: si cambias la fecha/hora debe ser futura
  const newDateTime = new Date(`${date}T${time}:00`);
  const existingDateTime = new Date(`${existing.date}T${existing.time}:00`);
  const now = new Date();

  if (newDateTime.getTime() !== existingDateTime.getTime()) {
    if (!(newDateTime > now)) {
      return res.redirect(`/reservas/editar/${id}?error=${encodeURIComponent('¡Error al editar! La nueva fecha y hora debe ser futura.')}`);
    }
  }

  // Actualizar
  reservations[reservationIndex] = {
    id,
    clientName,
    date,
    time,
    guests: parseInt(guests) || 1,
    notes: notes || '',
    celular: celular || ''
  };

  // opcional: persistir
  // persistToFile();

  return res.redirect('/');
});

// DELETE (POST /reservas/cancelar/:id)
app.post('/reservas/cancelar/:id', (req, res) => {
  const id = parseInt(req.params.id);
  reservations = reservations.filter(r => r.id !== id);
  // persistToFile();
  res.redirect('/');
});

// DEBUG: ver reservas en JSON
app.get('/__debug/reservations', (req, res) => {
  res.json({ reservations, nextId });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Sistemas de Reservas Ortiz iniciado en http://localhost:${PORT}`);
  });
}

module.exports = { app, isFutureDate, reservations };
