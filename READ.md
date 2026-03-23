# Proyecto-API-bancarias-y-Tests
Este proyecto es una **simulación de un sistema bancario centrada en el control de calidad**, diseñada para practicar:

* Pruebas de API con Postman
* Validación de bases de datos con PostgreSQL
* Integración del backend mediante Node.js (Express + Sequelize)
* Validación de la lógica de negocio (coherencia financiera)

El sistema modela un entorno bancario simplificado con:

* Clientes
* Cuentas
* Transacciones (ingresos y reintegros)

---

##  Pila tecnológica

* **Node.js + Express**
* **PostgreSQL**
* **Sequelize ORM**
* **Postman (pruebas de API)**

---

##  Modelo de datos

### Tablas

* `clientes`
* `cuentas`
* `transacciones`
* `prestamos` (aún no se utiliza por completo)

### Relaciones

* Un cliente puede tener varias cuentas
* Una cuenta puede tener varias transacciones

---

## Endpoints de la API

###  Clientes

* `POST /clientes` → Crear cliente
* `GET /clientes` → Obtener todos los clientes
* `GET /clientes/:id` → Obtener cliente por ID

---

### Cuentas

* `POST /cuentas` → Crear cuenta
* `GET /cuentas` → Obtener todas las cuentas
* `GET /cuentas/:id` → Obtener cuenta por ID
* `GET /cuentas/cliente/:id_cliente` → Cuentas por cliente

---

###  Transacciones

* `POST /transacciones` → Crear transacción

  * Ingreso → aumenta el saldo
  * Retirada → valida el saldo disponible

---

### Puntos de conexión orientados al análisis y al control de calidad

* `GET /transacciones/resumen/:id_cuenta`
  → Recuento de transacciones por tipo

* `GET /transacciones/montos/:id_cuenta`
  → Total de ingresos frente a retiros

* `GET /transacciones/balance/:id_cuenta`
  → Compara:

  * Saldo calculado (a partir de las transacciones)
  * Saldo almacenado (tabla de cuentas)

* `GET /transacciones/ultima/:id_cuenta`
  → Última transacción

* `GET /transacciones/cuenta/:id_cuenta`
  → Transacciones con filtros:

  * `fecha_inicio`
  * `fecha_fin`
  * `tipo`

---

##  Lógica de negocio

### Ingresos

* Aumentar el saldo de la cuenta

### Retiradas

* Validar fondos suficientes
* Evitar descubiertos

### Validación del saldo

El sistema compara:

* Saldo almacenado (`cuentas.saldo`)
* Saldo calculado (a partir de las transacciones)

Esto permite detectar **inconsistencias en los datos**.

---

##  Enfoque de control de calidad

Este proyecto se centra en:

* Validación de la API (códigos de estado, esquema)
* Comprobaciones de consistencia de datos
* Casos extremos:

  * Saldo insuficiente
  * Cuenta no válida
  * Problemas de precisión decimal

---

##  Problemas conocidos / Hallazgos

### Error de precisión decimal

* Se han detectado diferencias entre:

  * Saldo almacenado
  * Saldo calculado

Ejemplo:

```json
{
  «balance_calculado»: 600,
  «saldo_guardado»: 600.02,
  «coincide»: false
}
```

✔ Causa principal: precisión de coma flotante en JavaScript
✔ Solución propuesta: comparación de tolerancia

---
## Mejoras futuras

* Añadir atomicidad de transacciones (transacciones de base de datos)
* Incorporar Kafka para una arquitectura basada en eventos
* Añadir NiFi para flujos de datos y supervisión
* Mejorar el manejo de decimales (Big.js / números enteros)

---

##  Kafka y NiFi (integración conceptual)

### Apache Kafka

Se utilizaría para:

* Emitir eventos como:

  * `transaction_created`
  * `balance_updated`
* Habilitar el procesamiento asíncrono
* Mejorar la escalabilidad

---

### Apache NiFi

Se utilizaría para:

* Consumir eventos de Kafka
* Enrutar y transformar datos
* Supervisar flujos de transacciones
* Integrarse con sistemas de análisis

---

## Colección de Postman

El proyecto incluye una colección de Postman que abarca:

* Operaciones CRUD
* Flujos de lógica de negocio
* Escenarios de validación de control de calidad

---

## Cómo ejecutarlo

```bash
npm install
node app.js
```

El servidor se ejecuta en:

```text
http://localhost:3000
```

---

##  Autor

Proyecto práctico de backend centrado en el control de calidad para entrevistas técnicas.
