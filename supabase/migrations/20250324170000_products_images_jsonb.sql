-- Galería de imágenes por producto (URLs). Mantiene `image` como primera URL para compatibilidad.
-- Aplica en schemas donde exista `products` (tradexpar / public).

DO $$
DECLARE
  sch TEXT;
BEGIN
  FOREACH sch IN ARRAY ARRAY['tradexpar', 'public']::text[]
  LOOP
    IF to_regclass(format('%I.products', sch)) IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT ''[]''::jsonb',
        sch
      );
      EXECUTE format(
        $sql$
        UPDATE %I.products
        SET images = jsonb_build_array(trim(image::text))
        WHERE image IS NOT NULL
          AND length(trim(image::text)) > 0
          AND (
            images IS NULL
            OR images = '[]'::jsonb
            OR jsonb_array_length(COALESCE(images, '[]'::jsonb)) = 0
          )
        $sql$,
        sch
      );
      EXECUTE format(
        $sql$
        UPDATE %I.products
        SET image = trim(images->>0)
        WHERE image IS NULL
          AND images IS NOT NULL
          AND jsonb_typeof(images) = 'array'
          AND jsonb_array_length(images) > 0
          AND length(trim(COALESCE(images->>0, ''))) > 0
        $sql$,
        sch
      );
    END IF;
  END LOOP;
END $$;
