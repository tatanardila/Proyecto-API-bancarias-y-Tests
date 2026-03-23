const express = require('express');
const router = express.Router();

const { sequelize, DataTypes } = require('../db');

// Modelos
const Cuenta = require('./modelos/cuenta')(sequelize, DataTypes);
const Cliente = require('./modelos/cliente')(sequelize, DataTypes);

// ✅ Crear cuenta
router.post('/', async (req, res) => {
  try {
    const { id_cliente, saldo } = req.body;

    // Validar que el cliente exista
    const cliente = await Cliente.findByPk(id_cliente);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no existe' });
    }

    const nuevaCuenta = await Cuenta.create({
      id_cliente,
      saldo: saldo || 0
    });

    res.status(201).json(nuevaCuenta);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener todas las cuentas
router.get('/', async (req, res) => {
  try {
    const cuentas = await Cuenta.findAll();
    res.status(200).json(cuentas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener cuenta por ID
router.get('/:id', async (req, res) => {
  try {
    const cuenta = await Cuenta.findByPk(req.params.id);

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    res.status(200).json(cuenta);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener cuentas por cliente
router.get('/cliente/:id_cliente', async (req, res) => {
  try {
    const cuentas = await Cuenta.findAll({
      where: { id_cliente: req.params.id_cliente }
    });

    res.status(200).json(cuentas);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;