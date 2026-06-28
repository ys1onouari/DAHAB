# Fix — Affichage JSON multilingue (implémentation réelle)

## Problème

Les champs de configuration (nom du restaurant, sous-titre, noms de plats, descriptions, etc.)
sont stockés en base de données sous format JSON multilingue :

```json
{"fr":"RESTAURANT DAHAB COFFEE","en":"RESTAURANT DAHAB COFFEE","es":"RESTAURANT DAHAB COFFEE","ar":"مطعم داهب"}
```

Au lieu d'afficher uniquement la valeur correspondant à la langue active,
l'interface affichait le JSON brut entier en tant que texte visible.

---

## Cause

Le frontend récupérait la valeur brute depuis la base de données et l'affichait
directement sans la parser ni la filtrer selon la langue active.

---

## Solution appliquée

### 1. Ajouter `localized()` et `currentLang()` dans le module i18n

**Fichier :** `js/i18n.js` (lignes 90-107)

```javascript
export function currentLang() {
  return _i18n ? _i18n.language : 'fr';
}

export function localized(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{')) {
      try { value = JSON.parse(trimmed); }
      catch { return value; }
    } else {
      return value;
    }
  }
  if (typeof value !== 'object') return String(value);
  const lang = currentLang();
  return value[lang] || value.fr || Object.values(value)[0] || '';
}
```

**Comportement détaillé :**

| Condition | Retour |
|---|---|
| `value` est `null`, `undefined` ou `''` | `''` |
| `value` est une string **ne commençant pas par `{`** | la valeur telle quelle (texte simple) |
| `value` est une string commençant par `{` mais JSON invalide | la valeur brute inchangée |
| `value` est un objet JSON avec la clé de la langue active | `value[currentLang]` |
| `value` est un objet JSON **sans** la clé de la langue active | `value.fr` (fallback français) |
| `value` est un objet JSON sans FR non plus | `Object.values(value)[0]` (1ère dispo) |
| Aucune des clés ci-dessus | `''` |

**La langue active (`currentLang`)** est lue depuis la bibliothèque **i18next**,
initialisée dans le même fichier avec auto-détection via `localStorage` et `navigator`.

---

### 2. Importer `localized` dans les modules qui affichent ces champs

```javascript
// js/menu.js, ligne 2
import { t, localized } from './i18n.js';

// js/admin-dashboard.js, ligne 9
import { t, localized } from './i18n.js';
```

---

### 3. Appliquer `localized()` aux champs concernés

#### a) `js/menu.js` — 12 sites d'appel

| Ligne | Usage | Contexte |
|---|---|---|
| 96 | `localized(cat.name)` | Nom de catégorie depuis un ID |
| 145 | `localized(s.restaurant_name) \|\| t('hero.fallback')` | Titre du hero |
| 149 | `localized(s.restaurant_subtitle)` | Sous-titre du hero |
| 152 | `localized(s.restaurant_name)` | Document title + meta description |
| 235 | `localized(c.name)` | Grille des catégories (accueil) |
| 263 | `localized(dish.name)` | Attribut `alt` des images de plats |
| 278 | `localized(dish.name)` | Nom du plat dans `dishCard()` |
| 301 | `localized(c.name)` | Filtres par catégorie |
| 365 | `localized(dish.name)` | Toast notification "plat ajouté" |
| 422 | `localized(item.name)` | Nom dans le panier |
| 473 | `localized(dish.name)` | Message WhatsApp commande unitaire |
| 481 | `localized(c.name)` | Récapitulatif panier WhatsApp |

**Exemple réel — Hero (lignes 145-149) :**
```javascript
const titleEl = $('heroTitle');
const subtitleEl = $('heroSubtitle');
const s = SETTINGS;
if (titleEl) {
  titleEl.classList.remove('skeleton');
  titleEl.textContent = localized(s.restaurant_name) || t('hero.fallback');
}
if (subtitleEl && s.restaurant_subtitle) {
  subtitleEl.classList.remove('skeleton');
  subtitleEl.textContent = localized(s.restaurant_subtitle);
}
```

**Exemple réel — Carte d'un plat (lignes 273-278) :**
```javascript
return `
  <div class="dish-card${noImageClass}" data-id="${dish.id}">
    ${imgBlock}
    ${badgesBlock}
    <div class="dish-body">
      <div class="dish-name">${localized(dish.name)}</div>
      ...`
```

#### b) `js/admin-dashboard.js` — 6 sites d'appel

| Ligne | Usage | Contexte |
|---|---|---|
| 82 | `localized(c.name)` | helper `getCatName()` |
| 90 | `localized(item.name)` | Attribut `alt` des images dans le tableau admin |
| 94 | `localized(item.name)` | Nom de l'item dans le tableau admin |
| 138 | `localized(cat.name)` | Nom de la catégorie dans le tableau admin |
| 180 | `localized(c.name)` | Options du `<select>` catégorie dans le formulaire |
| 475 | `localized(c.name)` | Matching catégorie lors de l'import XLSX |

**Exemple réel — Tableau des items (lignes 88-94) :**
```javascript
tbody.innerHTML = items.map(item => {
  const img = item.image_url
    ? `<img src="${item.image_url}" class="item-img" alt="${localized(item.name)}"/>`
    : `<div class="item-img-placeholder"></div>`;
  return `<tr>
    <td data-label="${t('admin.tableImage')}">${img}</td>
    <td data-label="${t('admin.tableName')}"><strong style="color:var(--text)">${localized(item.name)}</strong></td>
    ...`
```

---

### 4. Gestion du RTL pour l'arabe

```javascript
// js/i18n.js, changeLanguage() ligne 49
document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
```

Le changement de direction est automatique lors du changement de langue via i18next.

---

## Fichiers modifiés (résumé)

| Fichier | Modification | Lignes |
|---|---|---|
| `js/i18n.js` | Ajout de `currentLang()` et `localized()` | 90-107 |
| `js/menu.js` | 12 appels à `localized()` | 96, 145, 149, 152, 235, 263, 278, 301, 365, 422, 473, 481 |
| `js/admin-dashboard.js` | 6 appels à `localized()` | 82, 90, 94, 138, 180, 475 |

---

## Notes pour reproduire ce fix dans un autre projet

1. **Framework quelconque** : la fonction `localized()` est pure JS, adaptable partout
2. **React / Next.js** : préférer un paramètre `currentLang` explicite au lieu de lire la langue en interne
3. **Fallback FR** : garantit qu'une valeur s'affiche toujours même si la langue demandée est absente
4. **La fonction est non-destructive** : si la valeur n'est pas du JSON, elle est retournée telle quelle
