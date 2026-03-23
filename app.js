const express = require('express');
const app = express();

const { sequelize } = require('./db');
const clientesRouter = require('./routes/clientes.routes');
const cuentasRouter = require('./routes/cuentas.routes');
const transaccionesRouter = require('./routes/transacciones.routes');

app.use(express.json());

app.use('/clientes', clientesRouter);
app.use('/cuentas', cuentasRouter);
app.use('/transacciones', transaccionesRouter);

app.get('/', (req, res) => {
  res.send('API funcionando');
});

const PORT = 3000;

sequelize.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos exitosa.');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error de conexión:', error);
  });