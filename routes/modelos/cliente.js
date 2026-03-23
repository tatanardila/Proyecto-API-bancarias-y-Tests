module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Cliente', {
    id_cliente: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ciudad: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'clientes',
    timestamps: false
  });
};