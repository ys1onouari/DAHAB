-- =============================================================================
-- Migration v2 : Ajouter la clé "ar" aux colonnes JSONB existantes
-- =============================================================================
-- Exécuter dans SQL Editor — chaque instruction individuellement.
-- Cette migration est NON-DESTRUCTIVE : elle ajoute la clé "ar" sans
-- modifier les clés existantes (fr, en, es).
--
-- Compatibilité : les données existantes continuent de fonctionner.
-- Le code utilise value[lang] || value.fr || '' — si "ar" est vide,
-- le fallback vers "fr" se fait automatiquement.
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. CATEGORIES — ajouter "ar" dans le JSONB name
-- ═════════════════════════════════════════════════════════════════════════════

UPDATE categories
SET name = name || '{"ar":""}'
WHERE NOT (name ? 'ar');

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. MENU_ITEMS — ajouter "ar" dans les JSONB name et description
-- ═════════════════════════════════════════════════════════════════════════════

UPDATE menu_items
SET name = name || '{"ar":""}'
WHERE NOT (name ? 'ar');

UPDATE menu_items
SET description = description || '{"ar":""}'
WHERE NOT (description ? 'ar');

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. SETTINGS — ajouter "ar" dans les JSONB des settings concernés
-- ═════════════════════════════════════════════════════════════════════════════

UPDATE settings
SET value = value || '{"ar":""}'
WHERE key IN ('restaurant_name', 'restaurant_subtitle')
  AND NOT (value ? 'ar');

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. VALIDATION
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 'categories' AS tbl, COUNT(*) AS total, COUNT(*) FILTER (WHERE name ? 'ar') AS has_ar
FROM categories
UNION ALL
SELECT 'menu_items' AS tbl, COUNT(*) AS total, COUNT(*) FILTER (WHERE name ? 'ar') AS has_ar
FROM menu_items;
