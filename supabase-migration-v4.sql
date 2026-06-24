-- =============================================================================
-- Migration v4 : Ajouter le toggle ordering_enabled dans settings
-- =============================================================================
-- Exécuter dans SQL Editor — une seule instruction.
-- =============================================================================

INSERT INTO settings (key, value)
VALUES ('ordering_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
