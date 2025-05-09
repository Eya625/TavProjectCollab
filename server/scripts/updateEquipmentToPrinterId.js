// migration.js
const mongoose = require('mongoose');

async function migrate() {
  // Remplacez par votre URI de connexion
  await mongoose.connect('mongodb://localhost:27017/BackendData');

  const collection = mongoose.connection.collection('curativemaintenances');
  const result = await collection.updateMany(
    { printerId: { $exists: true } },
    { $rename: { 'printerId': 'Printer_ID' } }
  );

  console.log(`Documents modifiés : ${result.modifiedCount}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
