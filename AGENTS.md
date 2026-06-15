# RESTAURANT FADAE RIF — Digital Menu

## Stack
- Vanilla JS SPA (ES6 modules, no framework, no bundler)
- Supabase (tables: `categories`, `menu_items`, `settings`; bucket: `dish-images`)
- CSS custom properties (dark mode only)
- Auth: `admin@fadaerif.com` / `fadaerif2026`
- i18n: `i18next` + `i18next-browser-languagedetector` (loaded from esm.sh CDN)

## Dev server (required for ES6 modules)
```bash
npx serve luxora --listen 3000
```
Opening `index.html` via `file://` will not work.

## Supabase
- Schema: `supabase-schema.sql` — run to create tables, RLS policies, seed data
- Anon key in `js/config.js` (public, safe for client)
- Personal access token: `<your-personal-access-token>`
- Project ref: `<your-project-ref>`
- Management API: `POST https://api.supabase.com/v1/projects/{ref}/database/query` with PAT as Bearer token

## Architecture
- `js/main.js` entrypoint: `await i18nReady` → `translatePage()` → `initMenu()` → `initNavigation()` → `initAuth()`
- `js/menu.js` — shared state (`MENU_DATA`, `CATEGORIES`, `CATEGORY_MAP`, `SETTINGS`, `WA_NUMBER`, `cart`), all rendering, WhatsApp. Filters by `category_id` (not text).
- `js/supabase.js` — lazy `getClient()` via `esm.sh/@supabase/supabase-js@2` (no top-level `await`). Exports `supabaseReady` promise.
- `js/admin-dashboard.js` — inline dashboard (no separate page), loaded after login. Forms use FR/EN/ES fields. XLSX export/import uses `Nom (FR)`/`Nom (EN)`/`Nom (ES)` multi-column headers.
- `js/navigation.js` — SPA routing via `[data-page]` delegation
- `js/auth.js` — login/logout/session via `supabaseReady`
- `js/i18n.js` — i18next config, exports `t()`, `localized()`, `i18nReady`, `translatePage()`, `changeLanguage()`
- `js/locales/{fr,en,es}.js` — translation dictionaries
- Dashboard is NOT a separate page — after login, click gear icon → `showPage('admin')` → `initAdmin()`

## Key conventions
- All UI text must be in French
- IDs: `camelCase`; classes: `kebab-case`; data attributes: `kebab-case`
- Currency: `DH` (no symbol)
- No emoji/icons — only inline SVG
- Palette: `#090909` bg, `#D40906` primary, `#F25928` secondary, `#E8D33A` accent, glassmorphism with `rgba(255,255,255,0.08)` borders
- i18n: use `t('key')` in JS, `data-i18n="key"` in HTML, `data-i18n-placeholder`/`data-i18n-title`/`data-i18n-alt`/`data-i18n-content` for attributes
- Add new keys to all three locale files (`fr.js`, `en.js`, `es.js`) when adding text

## Gotchas
- `supabase-js` is dynamically imported from CDN — **never** add top-level `await` in module scope
- Admin-dashboard uses arrow expression-body template literals (no `{ return ... }`) — avoid leftover `;` or `}` after backtick
- `showPage()` matches desktop nav by `data-page` attribute (not textContent) after i18n migration
- Fallback data in `menu.js` (FALLBACK_MENU, FALLBACK_CATS) renders when Supabase is unreachable
- Settings table is key-value — `getSettings()` returns `{ key: value }` map
- Categories use `icon_svg` column (stores URL or SVG string), but icon UI has been removed — field still exists for DB compat
- Image upload resizes to 800px via Canvas before sending to Supabase Storage
- i18next is dynamically imported from CDN — always `await i18nReady` before calling `translatePage()`
- XLSX export/import headers are fixed in French to preserve compatibility across language switches
- DB text fields (`categories.name`, `menu_items.name`, `menu_items.description`) are JSONB: `{fr: "...", en: "...", es: "..."}` — always use `localized(value)` to display, pass whole object to Supabase when saving
- `menu_items.category_id` references `categories.id` (FK with `ON DELETE RESTRICT`) — all filtering/forms use `category_id`, never text

## Commands
- Run: `npx serve luxora --listen 3000`
- Apply SQL: `POST /v1/projects/{ref}/database/query` with PAT + JSON body `{"query": "..."}`

## Migration v1 (TEXT → JSONB + category_id)
- Migration: `supabase-migration-v1.sql` — migre les colonnes TEXT vers JSONB (conserve les valeurs dans `fr`), remplace `category` (TEXT) par `category_id` (FK), crée une backup automatique dans `_backup_*`
- Rollback: `supabase-rollback-v1.sql` — restaure l'ancien schéma TEXT + `category` à partir des sauvegardes
- **Procédure** : (1) Sauvegarde via dashboard, (2) Exécuter migration dans SQL Editor, (3) Valider les logs, (4) Si erreur → rollback
