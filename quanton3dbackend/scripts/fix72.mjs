import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI nao definida'); process.exit(1); }

await mongoose.connect(uri);
console.log('Conectado ao MongoDB');

const result = await mongoose.connection.db.collection('parametros').updateMany(
  { nivelConfianca: { $exists: false } },
  { $set: { nivelConfianca: 'estimativa_inicial' } }
);

console.log('nivelConfianca preenchido em ' + result.modifiedCount + ' docs');

const total = await mongoose.connection.db.collection('parametros').countDocuments();
const semCampo = await mongoose.connection.db.collection('parametros').countDocuments({ nivelConfianca: { $exists: false } });
console.log('Total na colecao: ' + total);
console.log('Ainda sem nivelConfianca: ' + semCampo);

await mongoose.connection.close();
process.exit(0);
