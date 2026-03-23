module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Cuenta', {
    id_cuenta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    saldo: {
  type: DataTypes.DECIMAL(10, 2),
  defaultValue: 0.00
}
  }, {
    tableName: 'cuentas',
    timestamps: false
  });
};