-- Corrige products con created_at NULL (legacy)
-- Seguro: solo actualiza donde created_at es null

UPDATE products
SET created_at = now()
WHERE created_at IS NULL;

NOTIFY pgrst, 'reload schema';
