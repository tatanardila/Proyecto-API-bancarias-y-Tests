const express = require('express');
const router = express.Router();

const { sequelize, DataTypes } = require('../db');
const LogTransaccion = require('../mongo/log.model');
const { fn, col, Op } = require('sequelize');

const Transaccion = require('./modelos/transaccion')(sequelize, DataTypes);
const Cuenta = require('./modelos/cuenta')(sequelize, DataTypes);


router.post('/', async (req, res) => {
  try {
    const { id_cuenta, tipo, monto } = req.body;

    const montoNumerico = Number(monto);

    if (!id_cuenta) {
      await LogTransaccion.create({
        id_cuenta: 0,
        tipo: tipo || 'desconocido',
        monto: montoNumerico || 0,
        resultado: 'ERROR',
        mensaje: 'id_cuenta es obligatorio'
      });

      return res.status(400).json({ error: 'id_cuenta es obligatorio' });
    }

    const cuenta = await Cuenta.findByPk(id_cuenta);

    if (!cuenta) {
      await LogTransaccion.create({
        id_cuenta: Number(id_cuenta),
        tipo: tipo || 'desconocido',
        monto: montoNumerico || 0,
        resultado: 'ERROR',
        mensaje: 'Cuenta no existe'
      });

      return res.status(404).json({ error: 'Cuenta no existe' });
    }

    if (!['deposito', 'retiro'].includes(tipo)) {
      await LogTransaccion.create({
        id_cuenta: Number(id_cuenta),
        tipo: tipo || 'desconocido',
        monto: montoNumerico || 0,
        resultado: 'ERROR',
        mensaje: 'Tipo de transacción inválido'
      });

      return res.status(400).json({ error: 'Tipo de transacción inválido' });
    }

    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      await LogTransaccion.create({
        id_cuenta: Number(id_cuenta),
        tipo,
        monto: montoNumerico || 0,
        resultado: 'ERROR',
        mensaje: 'El monto debe ser mayor a 0'
      });

      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const saldoAnterior = Number(parseFloat(cuenta.saldo).toFixed(2));

    if (tipo === 'retiro') {
      if (saldoAnterior < montoNumerico) {
        await LogTransaccion.create({
          id_cuenta: Number(id_cuenta),
          tipo,
          monto: montoNumerico,
          resultado: 'ERROR',
          mensaje: 'Saldo insuficiente',
          saldo_anterior: saldoAnterior,
          saldo_nuevo: saldoAnterior
        });

        return res.status(400).json({ error: 'Saldo insuficiente' });
      }

      cuenta.saldo = Number((saldoAnterior - montoNumerico).toFixed(2));
    }

    if (tipo === 'deposito') {
      cuenta.saldo = Number((saldoAnterior + montoNumerico).toFixed(2));
    }

    await cuenta.save();

    const nuevaTx = await Transaccion.create({
      id_cuenta: Number(id_cuenta),
      tipo,
      monto: montoNumerico
    });

    const saldoNuevo = Number(parseFloat(cuenta.saldo).toFixed(2));

    await LogTransaccion.create({
      id_cuenta: Number(id_cuenta),
      tipo,
      monto: montoNumerico,
      resultado: 'OK',
      mensaje: 'Transacción realizada',
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo
    });

    res.status(201).json({
      mensaje: 'Transacción realizada',
      saldo_actual: saldoNuevo,
      transaccion: nuevaTx
    });
  } catch (error) {
    await LogTransaccion.create({
      id_cuenta: Number(req.body.id_cuenta) || 0,
      tipo: req.body.tipo || 'desconocido',
      monto: Number(req.body.monto) || 0,
      resultado: 'ERROR',
      mensaje: error.message
    });

    res.status(500).json({ error: error.message });
  }
});
//cantidad de transferencias por tipo (deposito/retiro) para una cuenta
router.get('/resumen/:id_cuenta', async (req, res) => {
  try {
    const { id_cuenta } = req.params;

    const cuenta = await Cuenta.findByPk(id_cuenta);

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no existe' });
    }

    const resumen = await Transaccion.findAll({
      attributes: [
        'tipo',
        [fn('COUNT', col('tipo')), 'cantidad']
      ],
      where: { id_cuenta },
      group: ['tipo']
    });

    const resumenFormateado = resumen.map(item => ({
      tipo: item.tipo,
      cantidad: Number(item.dataValues.cantidad)
    }));

    res.status(200).json({
      id_cuenta: Number(id_cuenta),
      resumen: resumenFormateado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//cantidad total depositado y retirado para una cuenta
router.get('/montos/:id_cuenta', async (req, res) => {
  try {
    const { id_cuenta } = req.params;

    const cuenta = await Cuenta.findByPk(id_cuenta);

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no existe' });
    }

    const transacciones = await Transaccion.findAll({
      where: { id_cuenta }
    });

    let total_depositado = 0;
    let total_retirado = 0;

    transacciones.forEach(tx => {
      const monto = parseFloat(tx.monto);

      if (tx.tipo === 'deposito') {
        total_depositado += monto;
      }

      if (tx.tipo === 'retiro') {
        total_retirado += monto;
      }
    });

    res.status(200).json({
      id_cuenta: Number(id_cuenta),
      total_depositado,
      total_retirado
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//balance actual de una cuenta (saldo inicial + depositos - retiros)
router.get('/balance/:id_cuenta', async (req, res) => {
  try {
    const { id_cuenta } = req.params;

    const cuenta = await Cuenta.findByPk(id_cuenta);

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no existe' });
    }

    const transacciones = await Transaccion.findAll({
      where: { id_cuenta }
    });

    let balance_calculado = 0;

    transacciones.forEach(tx => {
      const monto = parseFloat(tx.monto);

      if (tx.tipo === 'deposito') balance_calculado += monto;
      if (tx.tipo === 'retiro') balance_calculado -= monto;
    });

    balance_calculado = Number(balance_calculado.toFixed(2));
    const saldo_guardado = Number(parseFloat(cuenta.saldo).toFixed(2));

    res.status(200).json({
      id_cuenta: Number(id_cuenta),
      balance_calculado,
      saldo_guardado,
      coincide: balance_calculado === saldo_guardado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ultima transaccion por cuenta
router.get('/ultima/:id_cuenta', async (req, res) => {
  try {
    const { id_cuenta } = req.params;

    const cuenta = await Cuenta.findByPk(id_cuenta);

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no existe' });
    }

    const ultimaTransaccion = await Transaccion.findOne({
      where: { id_cuenta },
      order: [['fecha', 'DESC'], ['id_tx', 'DESC']]
    });

    if (!ultimaTransaccion) {
      return res.status(404).json({ error: 'La cuenta no tiene transacciones' });
    }

    res.status(200).json(ultimaTransaccion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ultima transaccion por cuenta con filtros opcionales de fecha y tipo
router.get('/cuenta/:id_cuenta', async (req, res) => {
  try {
    const { id_cuenta } = req.params;
    const { fecha_inicio, fecha_fin, tipo } = req.query;

    const cuenta = await Cuenta.findByPk(id_cuenta);

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no existe' });
    }

    const whereClause = { id_cuenta };

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    } else if (fecha_inicio) {
      whereClause.fecha = {
        [Op.gte]: fecha_inicio
      };
    } else if (fecha_fin) {
      whereClause.fecha = {
        [Op.lte]: fecha_fin
      };
    }

    const transacciones = await Transaccion.findAll({
      where: whereClause,
      order: [['fecha', 'DESC'], ['id_tx', 'DESC']]
    });

    res.status(200).json({
      id_cuenta: Number(id_cuenta),
      filtros_aplicados: {
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        tipo: tipo || null
      },
      total_registros: transacciones.length,
      transacciones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//logs de transacciones filtrados por cuenta desde  MongoDB
  router.get('/logs/:id_cuenta', async (req, res) => {
  try {
    const { id_cuenta } = req.params;

    const logs = await LogTransaccion.find({
      id_cuenta: Number(id_cuenta)
    }).sort({ fecha_evento: -1 });

    res.status(200).json({
      id_cuenta: Number(id_cuenta),
      total_logs: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await LogTransaccion.find().sort({ fecha_evento: -1 }).limit(50);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//logs por cuenta
router.get('/logs/:id_cuenta', async (req, res) => {
  try {
    const { id_cuenta } = req.params;

    const logs = await LogTransaccion.find({
      id_cuenta: Number(id_cuenta)
    }).sort({ fecha_evento: -1 });

    res.status(200).json({
      id_cuenta: Number(id_cuenta),
      total_logs: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;