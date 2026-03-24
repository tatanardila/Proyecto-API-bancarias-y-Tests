const mongoose = require('mongoose');

const conectarMongo = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/banca_logs');
    console.log('Mongo conectado');
  } catch (error) {
    console.error('Error Mongo:', error.message);
  }
};

module.exports = conectarMongo;