-- Historial de eventos del pedido
-- event_type: pedido_creado, pago_confirmado, pedido_rechazado, venta_cancelada, cambio_estado, stock_revertido

ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS event_type TEXT;

-- Valores permitidos para event_type
ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_event_type_check;
ALTER TABLE order_status_history ADD CONSTRAINT order_status_history_event_type_check
  CHECK (event_type IS NULL OR event_type IN (
    'pedido_creado',
    'pago_confirmado',
    'pedido_rechazado',
    'venta_cancelada',
    'cambio_estado',
    'stock_revertido'
  ));

CREATE INDEX IF NOT EXISTS idx_order_status_history_event ON order_status_history(event_type);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON order_status_history(created_at DESC);

COMMENT ON COLUMN order_status_history.event_type IS 'Tipo de evento: pedido_creado, pago_confirmado, pedido_rechazado, venta_cancelada, cambio_estado, stock_revertido';

NOTIFY pgrst, 'reload schema';
