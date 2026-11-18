const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
const mongoURI = 'mongodb+srv://60524191_db_user:bodega2026@cluster0.0o16pyl.mongodb.net/bodega_thalia?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
  tlsAllowInvalidCertificates: true
})
  .then(() => console.log('✅ Conectado exitosamente a MongoDB (bodega_thalia)'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err.message));

// Esquema de tus productos
const productoSchema = new mongoose.Schema({
  title: String,
  category: String,
  categoryName: String,
  price: Number,
  unit: String,
  image: String
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

const Producto = mongoose.model('Producto', productoSchema, 'productos');

// Endpoint para que tu script.js consuma los productos
app.get('/api/productos', async (req, res) => {
  try {
    const results = await Producto.find();
    res.json(results);
  } catch (err) {
    console.error('Error al consultar productos:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// Iniciar servidor en el puerto 3002
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});