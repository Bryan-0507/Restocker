# Resultados: set iteration-tests, modelo gemini-3.5-flash-lite

10 casos por versión. Sin archivos: ninguno.
Las métricas excluyen los errores técnicos (saturación o timeout sin respuesta).

| Versión | Casos | Estado correcto | Categoría de rechazo | Precisión | Recall | Propuesta perfecta | Formato inválido | Errores técnicos | Latencia p50 / p95 | Costo total |
| :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- |
| captura-v0 | 10 | 70 % | 0 % | 73 % | 100 % | 100 % | 0 | 0 | 1.3 s / 5.0 s | $0.0027 |
| captura-v1 | 10 | 90 % | 0 % | 100 % | 88 % | 88 % | 0 | 0 | 1.5 s / 11.5 s | $0.0154 |
| captura-v2 | 10 | 100 % | 0 % | 100 % | 100 % | 100 % | 0 | 0 | 1.8 s / 34.5 s | $0.0153 |
| captura-v3 | 10 | 100 % | 100 % | 100 % | 100 % | 100 % | 0 | 0 | 1.7 s / 17.0 s | $0.0192 |
| captura-v4 | 10 | 100 % | 100 % | 100 % | 100 % | 100 % | 0 | 0 | 2.3 s / 3.1 s | $0.0220 |
| captura-v5 | 10 | 100 % | 100 % | 100 % | 100 % | 100 % | 0 | 0 | 1.7 s / 4.3 s | $0.0206 |
| captura-v6 | 10 | 100 % | 100 % | 100 % | 100 % | 100 % | 0 | 0 | 1.5 s / 4.3 s | $0.0212 |

## Fallas

### captura-v0

- **iteration-test-03 · Foto sin relación:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba sin_relacion y salió ninguna; Sobró: sin producto (?), ajuste, sin cantidad
- **iteration-test-04 · Órdenes a la app:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba instrucciones y salió ninguna; Sobró: Mochis Fresa, ajuste, 50
- **iteration-test-05 · Pregunta por existencias:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba consulta y salió ninguna; Sobró: Ocean Bomb, ajuste, sin cantidad

### captura-v1

- **iteration-test-01 · Hay algo sin contar:** Estado: se esperaba aceptada y salió rechazada; Faltó: Mochi Vainilla, ajuste, sin cantidad
- **iteration-test-03 · Foto sin relación:** Categoría de la entrada 1: se esperaba sin_relacion y salió ninguna
- **iteration-test-04 · Órdenes a la app:** Categoría de la entrada 1: se esperaba instrucciones y salió ninguna
- **iteration-test-05 · Pregunta por existencias:** Categoría de la entrada 1: se esperaba consulta y salió ninguna

### captura-v2

- **iteration-test-03 · Foto sin relación:** Categoría de la entrada 1: se esperaba sin_relacion y salió ninguna
- **iteration-test-04 · Órdenes a la app:** Categoría de la entrada 1: se esperaba instrucciones y salió ninguna
- **iteration-test-05 · Pregunta por existencias:** Categoría de la entrada 1: se esperaba consulta y salió ninguna
