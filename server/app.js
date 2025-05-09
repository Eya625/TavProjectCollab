require('dotenv').config();

// --- Core & Framework Modules ---
const http     = require('http');
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path     = require('path');

// --- Route Handlers ---
const userRoutes = require('./routes/userRoutes');
const consumptionRoutes = require('./routes/ConsumptionRoutes');
const olaRoutes = require('./routes/olaRoutes');
const curativeMaintenanceRoutes  = require('./routes/curativeMaintenanceRoutes');
const powerBiRoutes= require('./routes/powerBIRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const billingRoutes = require('./routes/billingRoutes');
const printerRoutes = require('./routes/printerRoutes');
const detailsRelevesRoutes =require('./routes/detailsRelevesRoutes');
const invoicePDFRoutes = require('./routes/invoicePDFRoutes');
// --- App & Server Initialization ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

// --- Global Middleware ---
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('MongoDB Connected');

    // 1) Récupère la connexion native
    const db = mongoose.connection;

    // 2) Lorsque la connexion est ouverte, start le change stream
    db.once('open', () => {
      console.log('Ouveture du change stream…');

      // remplace 'consumptions' par le nom réel de ta collection
      const coll = db.collection('consumptions');

      // 3) Lance le watch()
      const changeStream = coll.watch();

      changeStream.on('change', change => {
        console.log('🔄 ChangeStream event:', change);
        if (change.operationType === 'insert') {
          // envoie le document inséré aux clients connectés
          io.emit('dataChanged', change.fullDocument);
        }
      });

      changeStream.on('error', err => {
        console.error('ChangeStream error:', err);
      });
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---
app.use('/api/user', userRoutes);
app.use('/api/consumption', consumptionRoutes); // partir facturation d'OLA
app.use('/api', olaRoutes);
app.use('/api/maintenance', curativeMaintenanceRoutes);
app.use('/api/powerbi', powerBiRoutes(io));
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/printers',printerRoutes);
app.use('/api/billing/releves', detailsRelevesRoutes);
app.use('/api/invoicespdf', invoicePDFRoutes);


// --- Socket.io Events ---
io.on('connection', socket => {
  console.log('Client connecté via Socket.io');
  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

// après tous tes app.use('/api/…')
const dashboardRouter = require('./routes/dashboard');  // <-- assure-toi du bon nom de fichier
app.use('/api/dashboard', dashboardRouter);
// --- Start Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
