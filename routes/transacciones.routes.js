const express = require('express');
const router = express.Router();

const { sequelize, DataTypes } = require('../db');
const { fn, col, Op } = require('sequelize');

const Transaccion = require('./modelos/transaccion')(sequelize, DataTypes);
const Cuenta = require('./modelos/cuenta')(sequelize, DataTypes);


router.post('/', async (req, res) => {
  try {
    const { id_cuenta, tipo, monto } = req.body;

    const cuenta = await Cuenta.findByPk(id_cuenta);

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no existe' });
    }

    
    if (tipo === 'retiro') {
  if (parseFloat(cuenta.saldo) < parseFloat(monto)) {
    return res.status(400).json({ error: 'Saldo insuficiente' });
  }

  cuenta.saldo = (
    parseFloat(cuenta.saldo) - parseFloat(monto)
  ).toFixed(2);
}

if (tipo === 'deposito') {
  cuenta.saldo = (
    parseFloat(cuenta.saldo) + parseFloat(monto)
  ).toFixed(2);
}

    await cuenta.save();

    const nuevaTx = await Transaccion.create({
      id_cuenta,
      tipo,
      monto
    });

    res.status(201).json({
      mensaje: 'Transacción realizada',
      saldo_actual: cuenta.saldo,
      transaccion: nuevaTx
    });

  } catch (error) {
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
module.exports = router;