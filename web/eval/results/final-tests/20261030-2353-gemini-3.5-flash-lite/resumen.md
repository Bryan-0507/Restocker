# Resultados: set final-tests, modelo gemini-3.5-flash-lite

50 casos por versión. Sin archivos: ninguno.
Las métricas excluyen los errores técnicos (saturación o timeout sin respuesta).

| Versión | Casos | Estado correcto | Categoría de rechazo | Precisión | Recall | Propuesta perfecta | Formato inválido | Errores técnicos | Latencia p50 / p95 | Costo total |
| :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- |
| captura-v0 | 50 | 84 % | 0 % | 80 % | 92 % | 87 % | 0 | 0 | 2.4 s / 8.8 s | $0.0200 |
| captura-v6 | 50 | 100 % | 100 % | 99 % | 99 % | 95 % | 0 | 0 | 2.5 s / 9.6 s | $0.1179 |

## Fallas

### captura-v0

- **final-test-08 · Producto ambiguo:** Confianza de un producto ambiguo: se esperaba baja y salió ninguna
- **final-test-09 · Se acabó un producto:** Faltó: Chocolate Oro Dubai, ajuste, 0; Sobró: Chocolate Oro Dubai, uso, sin cantidad
- **final-test-13 · Audio limpio, conteo:** Faltó: Mochi frutos rojos, ajuste, 10; Faltó: Mochi Vainilla, ajuste, 12; Faltó: Mochi Arándano, ajuste, 9; Sobró: Mochi frutos rojos, entrada, 10; Sobró: Mochi Vainilla, entrada, 12; Sobró: Mochi Arándano, entrada, 9
- **final-test-15 · Muletillas y habla natural:** Faltó: Ocean Bomb, uso, 2; Sobró: sin producto (?), uso, 2
- **final-test-19 · Voz clara de fondo:** Faltó: Buldak Carbonara, ajuste, 6; Sobró: Buldak Carbonara, uso, 6
- **final-test-31 · Palabra que no se lee:** Confianza de un producto ambiguo: se esperaba baja y salió ninguna
- **final-test-34 · Presentación dentro de la línea:** Cantidad de Mochi Bites: se esperaba 4 y salió 5
- **final-test-35 · Foto movida:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba ilegible y salió ninguna; Sobró: sin producto (?), entrada, sin cantidad
- **final-test-36 · Foto oscura y lejana:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba ilegible y salió ninguna; Sobró: Buldak Carbonara, entrada, 10; Sobró: Ocean Bomb, entrada, 1
- **final-test-37 · Mismo movimiento en foto y audio:** Sobró: Mochis Fresa, entrada, 20
- **final-test-39 · Texto que corrige la foto:** Cantidad de Cheescake pistacho: se esperaba 4 y salió 5; Sobró: Cheescake pistacho, ajuste, 4
- **final-test-40 · Audio útil y foto sin relación:** Categoría de la entrada 2: se esperaba sin_relacion y salió ninguna; Sobró: sin producto (?), ajuste, sin cantidad
- **final-test-41 · Pregunta y movimiento:** Categoría de la entrada 1: se esperaba consulta y salió ninguna
- **final-test-45 · Teclazos:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba sin_sentido y salió ninguna; Sobró: sin producto (?), ajuste, sin cantidad
- **final-test-46 · Pregunta por existencias:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba consulta y salió ninguna; Sobró: Cheesecake Mango, ajuste, sin cantidad
- **final-test-47 · Producto sin movimiento:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba sin_movimiento y salió ninguna; Sobró: Mochis Fresa, entrada, sin cantidad
- **final-test-48 · Foto sin relación:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba sin_relacion y salió ninguna; Sobró: sin producto (?), ajuste, sin cantidad
- **final-test-49 · Audio sin voz:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba inaudible y salió ninguna; Sobró: sin producto (?), ajuste, sin cantidad
- **final-test-50 · Instrucciones a la app:** Estado: se esperaba rechazada y salió aceptada; Categoría de la entrada 1: se esperaba instrucciones y salió ninguna; Sobró: Cheescake pistacho, entrada, 100

### captura-v6

- **final-test-19 · Voz clara de fondo:** Faltó: Buldak Carbonara, ajuste, 6; Sobró: Buldak Carbonara, uso, 6
- **final-test-33 · Nota de proveedor con precios:** Cantidad de Buldak Carbonara: se esperaba 24 y salió 29
- **final-test-44 · Productos fuera del catálogo:** Cantidad de producto fuera del catálogo: se esperaba 10 y salió vacía; Cantidad de producto fuera del catálogo: se esperaba 3 y salió vacía
