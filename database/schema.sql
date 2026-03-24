CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    ciudad VARCHAR(50)
);

CREATE TABLE cuentas (
    id_cuenta SERIAL PRIMARY KEY,
    id_cliente INT,
    saldo DECIMAL(10,2),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE transacciones (
    id_tx SERIAL PRIMARY KEY,
    id_cuenta INT,
    tipo VARCHAR(20),
    monto DECIMAL(10,2),
    fecha DATE,
    FOREIGN KEY (id_cuenta) REFERENCES cuentas(id_cuenta)
);