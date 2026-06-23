# CHANGELOG_APPLY — Toggle "Afficher les photos des plats"

## Résumé
Ajout d'un toggle dans le dashboard admin (section Configuration) qui contrôle
l'affichage des photos des plats dans le menu PUBLIC. Quand le toggle est OFF,
les balises `<img>` et leur conteneur `.dish-img-wrap` sont supprimés du rendu
public ; les badges (catégorie, indisponibilité) sont déplacés dans un conteneur
`.dish-badges-inline` statique. Le tableau admin CRUD continue d'afficher les
miniatures dans tous les cas.

---

## Fichiers modifiés

### 1. `supabase-schema.sql` — Seed settings

**Avant :**
```sql
   ('wa_number',           '212661234567');
```

**Après :**
```sql
   ('wa_number',           '212661234567'),
  ('show_dish_images',    'true');
```

---

### 2. `supabase-migration-v3.sql` — Migration SQL (NOUVEAU FICHIER)

**Contenu complet :**
```sql
-- =============================================================================
-- Migration v3 : Ajouter le toggle show_dish_images dans settings
-- =============================================================================
-- Exécuter dans SQL Editor — une seule instruction.
-- =============================================================================

INSERT INTO settings (key, value)
VALUES ('show_dish_images', 'true')
ON CONFLICT (key) DO NOTHING;
```

---

### 3. `js/locales/fr.js` — +3 clés admin

**Avant (lignes 147-148) :**
```js
    configGoogleReviewsUrl: 'Google Reviews URL',
  },
```

**Après (lignes 147-151) :**
```js
    configGoogleReviewsUrl: 'Google Reviews URL',
    configShowDishImages: 'Afficher les photos des plats',
    configShowDishImagesOn: 'Photos affichées',
    configShowDishImagesOff: 'Photos masquées',
  },
```

---

### 4. `js/locales/en.js` — +3 clés admin

**Avant (lignes 147-148) :**
```js
    configGoogleReviewsUrl: 'Google Reviews URL',
  },
```

**Après (lignes 147-151) :**
```js
    configGoogleReviewsUrl: 'Google Reviews URL',
    configShowDishImages: 'Show dish images',
    configShowDishImagesOn: 'Photos shown',
    configShowDishImagesOff: 'Photos hidden',
  },
```

---

### 5. `js/locales/es.js` — +3 clés admin

**Avant (lignes 147-148) :**
```js
    configGoogleReviewsUrl: 'Google Reviews URL',
  },
```

**Après (lignes 147-151) :**
```js
    configGoogleReviewsUrl: 'Google Reviews URL',
    configShowDishImages: 'Mostrar fotos de los platos',
    configShowDishImagesOn: 'Fotos mostradas',
    configShowDishImagesOff: 'Fotos ocultas',
  },
```

---

### 6. `js/locales/ar.js` — +3 clés admin

**Avant (lignes 147-148) :**
```js
    configGoogleReviewsUrl: 'Google Reviews URL',
  },
```

**Après (lignes 147-151) :**
```js
    configGoogleReviewsUrl: 'Google Reviews URL',
    configShowDishImages: 'إظهار صور الأطباق',
    configShowDishImagesOn: 'الصور معروضة',
    configShowDishImagesOff: 'الصور مخفية',
  },
```

---

### 7. `index.html` — Toggle dans la config-grid

**Avant (lignes 233-234) :**
```html
              <div class="form-group full"><label data-i18n="admin.configGoogleReviewsUrl">Google Reviews URL</label><input name="google_reviews_url" type="url"/></div>
            </div>
```

**Après (lignes 233-241) :**
```html
              <div class="form-group full"><label data-i18n="admin.configGoogleReviewsUrl">Google Reviews URL</label><input name="google_reviews_url" type="url"/></div>
              <div class="form-group full">
                <label data-i18n="admin.configShowDishImages">Afficher les photos des plats</label>
                <div class="toggle-wrap">
                  <button type="button" class="toggle on" id="adminShowDishImages" role="switch" aria-checked="true"></button>
                  <span class="toggle-label" data-i18n="admin.configShowDishImagesOn">Photos affichées</span>
                </div>
              </div>
            </div>
```

---

### 8. `js/admin-dashboard.js` — 4 modifications

#### 8a. CONFIG_KEYS

**Avant (ligne 636) :**
```js
const CONFIG_KEYS = ['restaurant_name','restaurant_subtitle','address','hours','phone','phone_raw','email','instagram','wa_number','google_reviews_url'];
```

**Après (ligne 636) :**
```js
const CONFIG_KEYS = ['restaurant_name','restaurant_subtitle','address','hours','phone','phone_raw','email','instagram','wa_number','google_reviews_url','show_dish_images'];
```

#### 8b. loadConfig() — Initialisation du toggle

**Avant (lignes 638-662) :**
```js
async function loadConfig() {
  try {
    configData = await getSettings();
    const form = document.getElementById('adminConfigForm');
    if (!form) return;
    CONFIG_KEYS.forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = configData[key] || '';
    });
  } catch (e) {
    console.warn('Échec du chargement de la configuration :', e);
  }
}
```

**Après (lignes 638-662) :**
```js
async function loadConfig() {
  try {
    configData = await getSettings();
    const form = document.getElementById('adminConfigForm');
    if (!form) return;
    CONFIG_KEYS.forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = configData[key] || '';
    });
    const showDishImagesToggle = document.getElementById('adminShowDishImages');
    const showDishImagesLabel = showDishImagesToggle?.nextElementSibling;
    const showImages = configData.show_dish_images !== 'false';
    if (showDishImagesToggle) {
      showDishImagesToggle.classList.toggle('on', showImages);
      showDishImagesToggle.setAttribute('aria-checked', showImages);
    }
    if (showDishImagesLabel) {
      showDishImagesLabel.textContent = showImages
        ? t('admin.configShowDishImagesOn')
        : t('admin.configShowDishImagesOff');
    }
  } catch (e) {
    console.warn('Échec du chargement de la configuration :', e);
  }
}
```

#### 8c. bindEvents() — Click listener unique

**Avant (lignes 305-309) :**
```js
      const id = Number(dc.dataset.deleteCat);
      if (await showConfirm(t('admin.deleteConfirmCat'))) { await deleteCategory(id); await refresh(); }
    }
  });
}

function setupItemForm(item) {
```

**Après (lignes 305-322) :**
```js
      const id = Number(dc.dataset.deleteCat);
      if (await showConfirm(t('admin.deleteConfirmCat'))) { await deleteCategory(id); await refresh(); }
    }
  });

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('#adminShowDishImages');
    if (!toggle) return;
    const isOn = toggle.classList.toggle('on');
    toggle.setAttribute('aria-checked', isOn);
    const label = toggle.nextElementSibling;
    if (label) {
      label.textContent = isOn
        ? t('admin.configShowDishImagesOn')
        : t('admin.configShowDishImagesOff');
    }
  });
}

function setupItemForm(item) {
```

#### 8d. adminSaveConfig — Injection de la valeur du toggle

**Avant (lignes 673-684) :**
```js
  const updates = {};
  CONFIG_KEYS.forEach(key => { updates[key] = fd.get(key) || ''; });
  configData = updates;
```

**Après (lignes 673-684) :**
```js
  const updates = {};
  CONFIG_KEYS.forEach(key => { updates[key] = fd.get(key) || ''; });
  const showDishImagesToggle = document.getElementById('adminShowDishImages');
  updates.show_dish_images = showDishImagesToggle?.classList.contains('on') ? 'true' : 'false';
  configData = updates;
```

---

### 9. `js/menu.js` — dishCard() réécrite en totalité

**Avant (lignes 235-272) :**
```js
function dishCard(dish) {
  const badges = [];

  badges.push(`<span class="badge badge-category">${getCategoryName(dish.category_id)}</span>`);

  if (!dish.available) {
    badges.push(`<span class="badge badge-unavail">${t('dish.unavailable')}</span>`);
  }

  const imgHtml = dish.image
    ? `<img src="${dish.image}" alt="${localized(dish.name)}" class="dish-img"/>`
    : `<div class="dish-img-placeholder"></div>`;

  return `
  <div class="dish-card" data-id="${dish.id}">
    <div class="dish-img-wrap">
      ${imgHtml}
      ${badges.join('')}
    </div>
    <div class="dish-body">
      <div class="dish-name">${localized(dish.name)}</div>
      <div class="dish-footer">
        <div>
          <span class="dish-price">${t('dish.price', { price: dish.price })}</span>
        </div>
        <div class="dish-actions">
          ${dish.available ? `<button class="add-cart-btn" data-action="cart">+</button>` : ''}
        </div>
      </div>
      ${dish.available
        ? `<button class="wa-btn" data-action="order" style="width:100%;margin-top:10px;justify-content:center;">
        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.541 5.87L0 24l6.268-1.508A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.939 0-3.765-.494-5.353-1.359l-.373-.21-3.863.929.972-3.756-.235-.391A9.963 9.963 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        ${t('dish.orderBtn')}
      </button>`
        : `<div style="text-align:center;font-size:12px;color:var(--text3);margin-top:10px;padding:8px;background:rgba(255,255,255,.04);border-radius:8px">${t('dish.unavailableMsg')}</div>`}
    </div>
  </div>`;
}
```

**Après (lignes 235-282) :**
```js
function dishCard(dish) {
  const showImages = SETTINGS.show_dish_images !== 'false';
  const badges = [];

  badges.push(`<span class="badge badge-category">${getCategoryName(dish.category_id)}</span>`);

  if (!dish.available) {
    badges.push(`<span class="badge badge-unavail">${t('dish.unavailable')}</span>`);
  }

  const noImageClass = showImages ? '' : ' dish-card--no-image';

  const imgBlock = showImages
    ? `<div class="dish-img-wrap">
        ${dish.image
          ? `<img src="${dish.image}" alt="${localized(dish.name)}" class="dish-img"/>`
          : `<div class="dish-img-placeholder"></div>`}
        ${badges.join('')}
      </div>`
    : '';

  const badgesBlock = !showImages && badges.length
    ? `<div class="dish-badges-inline">${badges.join('')}</div>`
    : '';

  return `
  <div class="dish-card${noImageClass}" data-id="${dish.id}">
    ${imgBlock}
    ${badgesBlock}
    <div class="dish-body">
      <div class="dish-name">${localized(dish.name)}</div>
      <div class="dish-footer">
        <div>
          <span class="dish-price">${t('dish.price', { price: dish.price })}</span>
        </div>
        <div class="dish-actions">
          ${dish.available ? `<button class="add-cart-btn" data-action="cart">+</button>` : ''}
        </div>
      </div>
      ${dish.available
        ? `<button class="wa-btn" data-action="order" style="width:100%;margin-top:10px;justify-content:center;">
        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.541 5.87L0 24l6.268-1.508A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.939 0-3.765-.494-5.353-1.359l-.373-.21-3.863.929.972-3.756-.235-.391A9.963 9.963 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        ${t('dish.orderBtn')}
      </button>`
        : `<div style="text-align:center;font-size:12px;color:var(--text3);margin-top:10px;padding:8px;background:rgba(255,255,255,.04);border-radius:8px">${t('dish.unavailableMsg')}</div>`}
    </div>
  </div>`;
}
```

---

### 10. `css/components.css` — 5 règles CSS après `.dish-card:hover`

**Avant (lignes 604-611) :**
```css
.dish-card:hover {
  border-color: rgba(199,154,59,0.2);
  box-shadow: var(--shadow-lg), var(--shadow-gold);
  transform: translateY(-4px);
}

.dish-img-wrap {
```

**Après (lignes 604-631) :**
```css
.dish-card:hover {
  border-color: rgba(199,154,59,0.2);
  box-shadow: var(--shadow-lg), var(--shadow-gold);
  transform: translateY(-4px);
}

.dish-card--no-image {
  padding-top: 0;
}

.dish-badges-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  padding: var(--space-sm) var(--space-md) var(--space-xs);
}

.dish-badges-inline .badge {
  position: static;
}

.dish-card--no-image .dish-body {
  padding-top: var(--space-sm);
}

.dish-img-wrap {
```

---

### 11. `css/components.css` — Fix visuel : badge chevauchant le nom du plat (mode sans photo)

**Contexte :** Après l'étape 10, quand le toggle "Afficher les photos" est OFF,
le badge catégorie (ex. "Pizza") reste aligné à gauche dans `.dish-badges-inline`,
exactement au même endroit que le nom du plat (`.dish-name`) en dessous. Comme
le badge et le titre commencent souvent par le même mot (ex. "Pizza Thon"), la
lecture devient confuse voire illisible.

**Racine :**
1. `.dish-badges-inline` utilise `justify-content: flex-start` (valeur par défaut)
   → badge collé à gauche, à la même colonne que `.dish-name`
2. Espacement vertical insuffisant : `padding-bottom: 0` sur `.dish-badges-inline`
   + `padding-top: var(--space-sm)` sur `.dish-body` = seulement 8 px de gap

**Avant (lignes 614-619) :**
```css
.dish-badges-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: var(--space-sm) var(--space-md) 0;
}
```

**Après (lignes 614-620) :**
```css
.dish-badges-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  padding: var(--space-sm) var(--space-md) var(--space-xs);
}
```

**Changements :**
| Propriété | Avant | Après | Effet |
|---|---|---|---|
| `justify-content` | `flex-start` (implicite) | `flex-end` | Bascule les badges à droite, loin du titre |
| `padding-bottom` | `0` | `var(--space-xs)` (4 px) | Gap supplémentaire avant `.dish-body` |

**Non-régression :**
- Mode photo ON : `.dish-badges-inline` n'est pas rendu → aucun impact
- RTL arabe : `flex-end` en RTL = côté gauche visuel (opposé au début du texte) → correct, aucun override nécessaire dans `rtl.css`
- Badges multiples (catégorie + indisponible) : restent groupés avec `gap: 6px` à droite
- Aucun changement JS nécessaire

## Ordre d'application recommandé

Cet ordre garantit que chaque fichier est cohérent avec les fichiers déjà modifiés
(sans référence circulaire ni dépendance non satisfaite) :

| Ordre | Fichier | Justification |
|---|---|---|
| 1 | `supabase-schema.sql` | La DB est la source de données — la définir d'abord permet de tester les seeds en local |
| 2 | `supabase-migration-v3.sql` | Migration pour bases existantes — indépendante, peut être exécutée à tout moment |
| 3 | `js/locales/{fr,en,es,ar}.js` | Les clés i18n doivent exister avant d'être référencées dans le HTML et le JS |
| 4 | `index.html` | Le markup du toggle référence les clés i18n (étape 3) et un id JS (étape 5) — peut précéder le JS |
| 5 | `js/admin-dashboard.js` | Utilise les clés i18n (étape 3) et l'id `#adminShowDishImages` (étape 4) |
| 6 | `js/menu.js` | Utilise `SETTINGS.show_dish_images` — la clé est déjà dans la DB (étape 1/2) et dans `CONFIG_KEYS` (étape 5) |
| 7 | `css/components.css` (étape 10) | Styles pour les classes produites par menu.js — peut être fait en dernier |
| 8 | `CHANGELOG_APPLY.md` | Documentation finale |
| 9 | `css/components.css` (étape 11) | Fix alignement badges — peut être appliqué après le CSS de base |

**Ordre compact :** DB → i18n → HTML → JS → CSS (v1) → doc → CSS (v2 fix badges)
