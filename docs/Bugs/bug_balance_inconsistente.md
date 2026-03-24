# BUG-001 - Inconsistencia entre balance calculado y saldo guardado por precisión decimal

## Título
Inconsistencia entre el balance calculado desde transacciones y el saldo almacenado en cuenta

## ID del bug
BUG-001

## Módulo
Transacciones / Balance

## Tipo de incidencia
Defecto funcional / Integridad de datos

## Descripción
Al consultar el endpoint de balance por cuenta, el sistema devuelve una diferencia entre el `balance_calculado` a partir del histórico de transacciones y el `saldo_guardado` en la tabla `cuentas`.

Se identificó una discrepancia de `0.02`, lo que provoca que el campo `coincide` retorne `false`, aun cuando el flujo funcional ejecutado corresponde a depósitos y retiros válidos.

## Ambiente
- Aplicación: API bancaria de práctica QA
- Backend: Node.js + Express
- ORM: Sequelize
- Base de datos: PostgreSQL
- Herramienta de pruebas: Postman
- Sistema operativo: Windows
- Entorno: Local
- URL base: `http://localhost:3000`

## Precondiciones
1. Debe existir un cliente registrado.
2. Debe existir al menos una cuenta asociada al cliente.
3. La cuenta debe tener transacciones de tipo `deposito` y/o `retiro`.

## Background
El sistema almacena el saldo actual de la cuenta en la tabla `cuentas` y, adicionalmente, expone un endpoint que recalcula el balance con base en la suma de depósitos y la resta de retiros registrados en la tabla `transacciones`.

En escenarios con operaciones decimales, se observó una diferencia entre ambos valores, probablemente asociada al manejo de precisión numérica en JavaScript.

## Endpoint afectado
`GET /transacciones/balance/:id_cuenta`

Ejemplo:
`GET http://localhost:3000/transacciones/balance/1`

## Pasos para reproducir
1. Crear un cliente mediante el endpoint `POST /clientes`.
2. Crear una cuenta asociada al cliente mediante `POST /cuentas`.
3. Ejecutar varias transacciones sobre la cuenta mediante `POST /transacciones`, combinando depósitos y retiros.
4. Consultar el balance mediante `GET /transacciones/balance/{id_cuenta}`.
5. Comparar los campos `balance_calculado` y `saldo_guardado`.

## Resultado actual
El sistema responde con valores distintos entre `balance_calculado` y `saldo_guardado`.

### Postman results
```json
{
  "id_cuenta": 1,
  "balance_calculado": 600,
  "saldo_guardado": 600.02,
  "coincide": false
}

resultado Esperado 
{
  "id_cuenta": 1,
  "balance_calculado": 600,
  "saldo_guardado": 600,
  "coincide": true
}

Severidad

Alta

Criticidad

Alta

Impacto

Este defecto afecta la consistencia financiera del sistema y puede generar:

diferencias entre el saldo visible y el saldo real calculado,
pérdida de confianza en la información expuesta por la API,
falsos positivos en validaciones de integridad,
riesgo funcional en contextos bancarios o financieros.