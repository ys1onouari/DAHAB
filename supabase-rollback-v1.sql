-- =============================================================================
-- Rollback v1 : Restaurer l'ancien schéma TEXT + category (TEXT)
-- =============================================================================
-- Exécuter si la migration v1 doit être annulée.
-- Les données sont restaurées depuis les colonnes name->>'fr' et
-- description->>'fr' (les autres langues sont perdues lors du rollback).
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. MENU_ITEMS : restaurer category (TEXT) depuis category_id
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS fk_menu_items_category;
DROP INDEX IF EXISTS idx_menu_items_category_id;

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE menu_items m
SET category = c.name->>'fr'
FROM categories c
WHERE m.category_id = c.id;

UPDATE menu_items SET category = '' WHERE category IS NULL;
ALTER TABLE menu_items ALTER COLUMN category SET NOT NULL;
ALTER TABLE menu_items DROP COLUMN IF EXISTS category_id;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. MENU_ITEMS : name + description JSONB → TEXT
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE menu_items
  ALTER COLUMN name TYPE TEXT
  USING COALESCE(name->>'fr', '');

ALTER TABLE menu_items ALTER COLUMN name SET NOT NULL;

ALTER TABLE menu_items
  ALTER COLUMN description TYPE TEXT
  USING COALESCE(description->>'fr', '');

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. CATEGORIES : name JSONB → TEXT
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE categories
  ALTER COLUMN name TYPE TEXT
  USING COALESCE(name->>'fr', '');

ALTER TABLE categories ALTER COLUMN name SET NOT NULL;
ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. NETTOYER LES TABLES DE BACKUP
-- ═════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS _backup_categories;
DROP TABLE IF EXISTS _backup_menu_items;
DROP TABLE IF EXISTS _backup_settings;
