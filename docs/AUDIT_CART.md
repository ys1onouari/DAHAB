# AUDIT CART — DAHAB COFFEE

Date : 2026-06-27
Fichiers audités : `js/menu.js`, `js/navigation.js`, `js/main.js`, `js/i18n.js`, `index.html`
Aucune modification de code n'a été effectuée.

---

## 1. Structure de l'état panier

| Propriété | Valeur |
|---|---|
| Variable | `let cart = []` — `js/menu.js:189` |
| Portée | Module-level, **non exportée**. Seules les fonctions de `menu.js` y accèdent |
| Persistance | Aucune. Tableau en mémoire vive, perdu au refresh. Pas de `localStorage` |
| Export | `cart` n'est jamais exporté. `openCart`, `closeCart`, `checkoutWhatsApp` sont les seules API exposées |

**Structure d'un item panier** — construite ligne 362 :

```js
cart.push({ ...dish, qty: 1 });
```

Un item est une copie *shallow* de l'objet `dish` (issu de `MENU_DATA`) avec un champ `qty` ajouté. Champs copiés : `id`, `name`, `category_id`, `price`, `description`, `tags`, `available`, `popular`, `image`.

---

## 2. Flux d'ajout au panier

**Fonction :** `addToCart(id)` — `js/menu.js:354-372`

```
1. Vérifie isOrderingEnabled()      → ligne 355
2. Trouve le dish dans MENU_DATA    → ligne 356
3. Vérifie existence dans cart      → ligne 358 : cart.find(c => c.id === id)
4. Si existant → incrémente qty     → ligne 360
5. Sinon → push { ...dish, qty: 1 } → ligne 362
6. Met à jour le badge              → ligne 364
7. Affiche un toast                 → ligne 365
8. Anime le badge (retrait/ajout classe) → lignes 366-371
```

**Détection d'existant :** `Array.find()` par `id`. Si l'item existe, **incrémentation** (`existing.qty++`), pas de doublon dans le tableau.

**Guard anti-clics multiples : AUCUN.** Pas de debounce, throttle, ou flag `isAdding`. Chaque appel à `addToCart` s'exécute synchrone et complètement.

---

## 3. Rendu du panier

**Fonction :** `renderCartItems()` — `js/menu.js:402-437`

**Comportement :**
- Lit le tableau `cart`
- **Écrase** tout le contenu via `container.innerHTML = cart.map(...).join('')` à la ligne 419
- Ne **append** jamais. Le remplacement est total.
- Cas vide (lignes 408-413) : `container.innerHTML = ''` puis `appendChild(empty)`

**Quand elle est appelée :**
| Appelant | Ligne |
|---|---|
| `openCart()` | 392 |
| `changeQty()` | 447 |
| `removeFromCart()` | 453 |

**Elle n'est PAS appelée par `addToCart()`.** Donc l'ajout d'un item ne re-rend pas le panier visuellement — seul le badge est mis à jour.

---

## 4. Listeners — inventaire complet (fichier:ligne)

### Dans `setupMenuEventListeners()` — `js/menu.js:507-550`
*Appelée depuis `initMenu()` ligne 559.*

| Cible | Ligne | Type | Callback | Comportement |
|---|---|---|---|---|
| `#filterChips` | 508 | `click` | anonyme | Filtre des catégories |
| `document` | 516 | `click` | anonyme | Délégation : détecte `.dish-card` + `[data-action]` → `addToCart` ou `orderWhatsApp`. Contient `e.stopPropagation()` ligne 526 |
| `#cartItems` | 535 | `click` | anonyme | Délégation : détecte `.cart-item` + `[data-action]` → `changeQty` ou `removeFromCart` |

### Dans `initNavigation()` — `js/navigation.js:4-18`
*Appelée UNE SEULE FOIS depuis `main.js:40`.*

| Cible | Ligne | Type | Callback |
|---|---|---|---|
| `document` | 5 | `click` | anonyme | Navigation `[data-page]` |
| `#cartOpenBtn` | 13 | `click` | `openCart` (référence nommée) |
| `#cartOverlay` | 14 | `click` | `closeCart` (référence nommée) |
| `#cartCloseBtn` | 15 | `click` | `closeCart` (référence nommée) |
| `#checkoutBtn` | 17 | `click` | `checkoutWhatsApp` (référence nommée) |

### Dans `main.js` — lang switcher
| Cible | Ligne | Type | Callback |
|---|---|---|---|
| `[data-i18n-lang]` | 21 | `click` | anonyme | Change langue + appelle `initMenu()` |

### `removeEventListener` présent ?
**Zéro.** Aucun listener n'est retiré. Les références nommées (`openCart`, `closeCart`, `checkoutWhatsApp`) pourraient l'être, mais ce n'est fait nulle part.

---

## 5. Changement de langue — impact sur le panier

### `changeLanguage()` dans `i18n.js:45-50`
N'appelle **pas** `initMenu()`. Elle fait seulement :
1. `_i18n.changeLanguage(lng)` — ligne 47
2. Met à jour `document.documentElement.lang` — ligne 48
3. Met à jour `document.documentElement.dir` pour l'arabe — ligne 49

### C'est le click handler dans `main.js:21-32` qui appelle `initMenu()`

```js
// main.js:27-31
await changeLanguage(lang);
translatePage();
try {
  await initMenu();
} catch (e) { ... }
```

### Conséquences :
1. **Le tableau `cart` n'est pas réinitialisé** — préservé entre les langues
2. **`initMenu()` est re-exécutée** → `setupMenuEventListeners()` est rappelée → **les listeners s'accumulent** (voir §7)
3. `renderMenuGrid()` ligne 567 re-rend les cartes des plats (traduites), les boutons "+" sont recréés mais les anciens listeners `document` persistent

---

## 6. Navigation SPA — délégation vs listeners directs

### `initNavigation()` — `js/navigation.js:4`
- **Navigation :** Délégation d'événement UNIQUE sur `document` pour `[data-page]` (ligne 5)
- **Panier/checkout :** Listeners DIRECTS sur `#cartOpenBtn`, `#cartOverlay`, `#cartCloseBtn`, `#checkoutBtn` (lignes 13-17)

### `initNavigation()` n'est appelée qu'UNE SEULE FOIS (`main.js:40`).
Pas de duplication des listeners de navigation.

### Dans `setupMenuEventListeners()` — `js/menu.js:507`
- **Boutons "+" et "order" :** Délégation sur `document` (ligne 516) — un seul listener pour TOUS les `.dish-card`
- **Boutons +/-/remove du panier :** Délégation sur `#cartItems` (ligne 535) — un seul listener

**Problème :** Ces deux délégations sont dans `setupMenuEventListeners()`, appelée à CHAQUE `initMenu()`.

---

## 7. Problèmes détectés

### Problème #1 — Accumulation de listeners `document` (GRAVITÉ : CRITIQUE)

- **Fichier:ligne :** `js/menu.js:559` → `setupMenuEventListeners()` appelée depuis `initMenu()`
- **Fichier:ligne :** `js/menu.js:516` → `document.addEventListener('click', ...)` (add-to-cart)
- **Fichier:ligne :** `js/menu.js:535` → `$('cartItems')?.addEventListener('click', ...)` (qty/remove)
- **Fichier:ligne :** `js/main.js:28` → `await initMenu()` dans le handler de changement de langue
- **Fichier:ligne :** `js/main.js:36` → premier appel `await initMenu()`

**Description :** `initMenu()` appelle `setupMenuEventListeners()` (ligne 559) à chaque exécution. Celle-ci attache des listeners anonymes sur `document` et `#cartItems` sans jamais les retirer. À chaque changement de langue, les listeners s'accumulent.

**Cause racine :** Aucun `removeEventListener`. Les callbacks sont des fonctions anonymes donc même `removeEventListener` serait inopérant. Aucun flag `initialized` pour sauter le `setupMenuEventListeners()` après le premier appel.

**Pire scénario :** Après N changements de langue, chaque clic sur "+" déclenche `addToCart()` N fois.

### Problème #2 — Pas de guard anti-clics multiples (GRAVITÉ : MOYENNE)

- **Fichier:ligne :** `js/menu.js:354-372`

**Description :** `addToCart()` n'a aucun mécanisme (debounce, throttle, verrou) pour protéger contre les clics rapides ou accidentels. Combiné au problème #1, l'effet est multiplié.

**Cause racine :** Absence de conception défensive sur les actions utilisateur.

### Problème #3 — `e.stopPropagation()` utilisé au lieu de `stopImmediatePropagation()` (GRAVITÉ : FAIBLE)

- **Fichier:ligne :** `js/menu.js:526`

**Description :** `e.stopPropagation()` n'empêche PAS les autres listeners sur le même élément (`document`) de s'exécuter. Avec des listeners accumulés (problème #1), tous les handlers s'exécutent.

### Problème #4 — `changeQty` et `removeFromCart` modifient `cart` sans protection contre lectures concurrentes (GRAVITÉ : FAIBLE)

- **Fichier:ligne :** `js/menu.js:439-454`

**Description :** Avec des listeners `#cartItems` accumulés, un clic sur "-" peut déclencher `changeQty` plusieurs fois. La première exécution peut supprimer l'item (`cart = cart.filter(...)`), et la seconde tente de trouver un item qui n'existe plus — retour silencieux (ligne 441). Pas de crash, mais incohérence possible.

---

## 8. Recommandations

### R1 — Éviter la re-attache des listeners (cible : `js/menu.js`)

**Fonction cible :** `initMenu()` et `setupMenuEventListeners()`

**Option A (recommandée) :** Sortir `setupMenuEventListeners()` de `initMenu()`. L'appeler une seule fois, par exemple dans un bloc au niveau module ou dans `main.js` après le premier `initMenu()`. Déplacer l'appel lignes 559 → hors de `initMenu()`.

**Option B :** Ajouter un flag `let listenersInitialized = false` au module. Dans `setupMenuEventListeners()`, si `true`, `return`. Passer à `true` après le premier appel. Ligne 559 reste, mais la fonction devient idempotente.

**Option C :** Utiliser `{ once: true }` ou des références nommées avec `removeEventListener` avant chaque ajout. Plus complexe, moins fiable avec des callbacks anonymes.

### R2 — Ajouter un debounce sur `addToCart` (cible : `js/menu.js:354`)

**Fonction cible :** `addToCart()`

Ajouter un debounce de ~300ms ou un simple flag :

```js
let addingLock = false;
function addToCart(id) {
  if (addingLock) return;
  addingLock = true;
  setTimeout(() => { addingLock = false; }, 300);
  // ... reste du code
}
```

### R3 — Remplacer `stopPropagation` par `stopImmediatePropagation` (cible : `js/menu.js:526`)

**Fonction cible :** Le handler `document` click dans `setupMenuEventListeners()`

Remède temporaire si R1 n'est pas appliqué. `stopImmediatePropagation()` empêche les autres listeners sur le même élément de s'exécuter.

**Attention :** Cela ne résout pas le problème de fond car si N listeners sont empilés et que le premier les empêche, les N-1 suivants ne s'exécutent pas — mais le prochain clic sur un autre bouton ne fera rien non plus. Solution partielle.

### R4 — Réinitialiser `cart` ou le préserver explicitement lors des changements de page (cible : `js/menu.js`)

Ajouter un mécanisme de persistence (localStorage) si le panier doit survivre à un refresh. Optionnel selon le besoin métier.

---

## 9. Hypothèse principale sur le bug de doublon

### Symptôme rapporté
> "Parfois un article ajouté s'affiche en double dans le panier"

### Analyse des chemins de code

Le scénario le plus probable est le suivant :

1. **`initMenu()` est appelée N fois** (1 fois au load + chaque changement de langue)
2. **`setupMenuEventListeners()` attache N listeners** sur `document` (ligne 516) et `#cartItems` (ligne 535)
3. **Quand l'utilisateur clique sur "+"** (`.add-cart-btn`), le listener `document` se déclenche N fois
4. **Chaque appel à `addToCart(id)`** (ligne 354) :
   - Premier appel : `cart.find()` → `undefined` → `cart.push({...dish, qty: 1})`
   - Appels suivants : `cart.find()` → trouve l'item → `existing.qty++`
5. **Résultat :** Un seul item dans le tableau `cart` avec `qty` = nombre de listeners déclenchés
6. **Visuellement :** L'item apparaît une seule fois dans le panier, mais avec une `qty` anormalement élevée

### Pourquoi "en double" pourrait être observé

Plusieurs explications possibles :

- **L'utilisateur interprète une `qty` > 1 comme un doublon** (le rendu montre `item.qty` dans `<span class="qty-num">` ligne 426)
- **Cas extrême :** Si un clic rapide et un changement de langue surviennent simultanément (le handler de langue est `async`), l'état de `cart` peut être momentanément incohérent pendant la ré-exécution de `initMenu()`
- **Avec 3+ listeners accumulés :** Un double-clic rapide = 6 appels à `addToCart` → l'utilisateur voit `qty = 6` sur un item qu'il a cliqué 2 fois. Interprétation plausible : "l'article est compté en double/triple"

### Lignes exactes impliquées dans le bug

| Étape | Fichier | Lignes |
|---|---|---|
| `initMenu()` appelle `setupMenuEventListeners()` | `js/menu.js` | 559 |
| Listener `document` attaché (add-to-cart) | `js/menu.js` | 516-533 |
| `initMenu()` appelé au changement de langue | `js/main.js` | 28 |
| `initMenu()` appelé au chargement initial | `js/main.js` | 36 |
| `addToCart` appelé N fois | `js/menu.js` | 354-372 |
| `qty` incrémentée sans limite | `js/menu.js` | 360 |
| `renderCartItems()` affiche la `qty` | `js/menu.js` | 426 |

### Test manuel de confirmation

1. Charger la page → cliquer "+" sur un plat → ouvrir le panier → qty = 1 ✓
2. Changer de langue (FR → EN) → cliquer "+" sur LE MÊME plat → qty = 2 ✗ (attendue : 1)
3. Changer de langue 2 fois de plus → cliquer "+" → qty = 4 ✗
4. Observer que chaque changement de langue ajoute un listener : `$._events` ou breakpoint dans `setupMenuEventListeners()` confirme l'accumulation
