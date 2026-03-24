const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  id_cuenta: {
    type: Number,
    required: true
  },
  tipo: {
    type: String,
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  resultado: {
    type: String,
    enum: ['OK', 'ERROR'],
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  saldo_anterior: {
    type: Number,
    default: null
  },
  saldo_nuevo: {
    type: Number,
    default: null
  },
  fecha_evento: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'logs'
});

module.exports = mongoose.model('LogTransaccion', logSchema);