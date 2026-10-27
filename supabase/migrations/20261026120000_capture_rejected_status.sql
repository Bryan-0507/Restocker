-- Capturas rechazadas por el modelo: ninguna entrada describe un movimiento de inventario.
-- Se guardan para medir qué tan bien rechaza (docs/decisiones-captura.md, punto 9).
-- No bloquean Capturar: el candado de una captura a la vez solo cubre procesando y en_revision.
--
-- Va sola en su migración: un valor nuevo de enum no se puede usar en la misma transacción
-- en que se agrega.

alter type public.capture_status add value 'rechazada' after 'descartada';
