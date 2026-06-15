-- =============================================================================
-- Migration v1 : TEXT → JSONB + category → category_id (FK)
-- =============================================================================
-- Exécuter dans SQL Editor — chaque instruction individuellement.
-- En cas d'erreur à une étape, exécuter supabase-rollback-v1.sql.
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- ÉTAPE 0 : BACKUP
-- ═════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS _backup_categories;
DROP TABLE IF EXISTS _backup_menu_items;
DROP TABLE IF EXISTS _backup_settings;

CREATE TABLE _backup_categories AS SELECT * FROM categories;
CREATE TABLE _backup_menu_items   AS SELECT * FROM menu_items;
CREATE TABLE _backup_settings     AS SELECT * FROM settings;

-- ═════════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1 : CATÉGORIES — TEXT → JSONB
-- ═════════════════════════════════════════════════════════════════════════════

-- 1a. Supprimer UNIQUE (JSONB ne supporte pas UNIQUE)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_unique;

-- 1b. Convertir le contenu en JSON string (compatible JSONB)
UPDATE categories
SET name = jsonb_build_object('fr', name, 'en', '', 'es', '')
WHERE id IS NOT NULL;

-- 1c. Changer le type de la colonne
ALTER TABLE categories
  ALTER COLUMN name TYPE JSONB USING name::jsonb;

-- ═════════════════════════════════════════════════════════════════════════════
-- ÉTAPE 2 : MENU_ITEMS — ajouter category_id
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id BIGINT;

UPDATE menu_items m
SET category_id = c.id
FROM categories c
WHERE m.category = c.name->>'fr';

-- ═════════════════════════════════════════════════════════════════════════════
-- ÉTAPE 3 : MENU_ITEMS — name + description TEXT → JSONB
-- ═════════════════════════════════════════════════════════════════════════════

-- 3a. Convertir le contenu name
UPDATE menu_items
SET name = jsonb_build_object('fr', name, 'en', '', 'es', '')
WHERE id IS NOT NULL;

-- 3b. Changer le type name
ALTER TABLE menu_items
  ALTER COLUMN name TYPE JSONB USING name::jsonb;

-- 3c. Supprimer la valeur par défaut de description (sinon ALTER TYPE échoue)
ALTER TABLE menu_items ALTER COLUMN description DROP DEFAULT;

-- 3d. Convertir le contenu description
UPDATE menu_items
SET description = jsonb_build_object('fr', COALESCE(description, ''), 'en', '', 'es', '')
WHERE true;

-- 3e. Changer le type description
ALTER TABLE menu_items
  ALTER COLUMN description TYPE JSONB USING description::jsonb;

-- ═════════════════════════════════════════════════════════════════════════════
-- ÉTAPE 4 : CONTRAINTES FINALES
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE menu_items ALTER COLUMN category_id SET NOT NULL;

ALTER TABLE menu_items
  ADD CONSTRAINT fk_menu_items_category
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- ÉTAPE 5 : SUPPRIMER L'ANCIENNE COLONNE
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE menu_items DROP COLUMN IF EXISTS category;

-- ═════════════════════════════════════════════════════════════════════════════
-- ÉTAPE 6 : VALIDATION
-- ═════════════════════════════════════════════════════════════════════════════

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('categories','menu_items')
ORDER BY table_name, ordinal_position;

SELECT 'categories' AS tbl, COUNT(*) AS total FROM categories
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items;

SELECT COUNT(*) AS fk_orphelines
FROM menu_items m LEFT JOIN categories c ON m.category_id = c.id
WHERE c.id IS NULL;
