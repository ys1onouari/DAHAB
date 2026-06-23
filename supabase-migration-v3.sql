-- =============================================================================
-- Migration v3 : Ajouter le toggle show_dish_images dans settings
-- =============================================================================
-- Exécuter dans SQL Editor — une seule instruction.
-- =============================================================================

INSERT INTO settings (key, value)
VALUES ('show_dish_images', 'true')
ON CONFLICT (key) DO NOTHING;
