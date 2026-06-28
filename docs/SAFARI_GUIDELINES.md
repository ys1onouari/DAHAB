# Safari / WebKit Guidelines

> Règles à respecter pour **TOUT** changement CSS/JS afin d'éviter les régressions crash sur Safari iOS WebKit.

---

## 1. Interdictions GPU/WebKit (CSS)

À vérifier **avant chaque commit** touchant au CSS.

| Règle | Interdit | Autorisé | Risque |
|---|---|---|---|
| **drop-shadow sur texte/éléments animés** | `filter: drop-shadow(...)` sur texte ou éléments avec `:hover`/animation | `text-shadow` ou `box-shadow` | Post-composition pass → GPU layer overload |
| **transition générique** | `transition: all` | `transition: background 0.3s, color 0.3s, ...` (propriétés explicites) | Safari monitor toutes les propriétés → perfs dégradées |
| **backdrop-filter excessif** | Plus de 2-3 éléments visibles simultanément avec `backdrop-filter` | Maximum 1-2, jamais superposés | Layer overload → crash renderer |
| **@keyframes sur mauvaises propriétés** | Animer `background-position`, `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, `filter` | Animer uniquement `transform` et `opacity` | Layout/paint à chaque frame → jank + crash |

### Exemples

```css
/* ✅ CORRECT — text-shadow au lieu de filter: drop-shadow() */
.hero-title {
  text-shadow: 0 2px 8px rgba(24, 33, 36, 0.6);
}

/* ❌ INTERDIT — filter: drop-shadow() sur du texte */
.hero-title {
  filter: drop-shadow(0 2px 8px rgba(24, 33, 36, 0.6));
}
```

```css
/* ✅ CORRECT — propriétés explicites */
.dish-card {
  transition: transform 0.3s, box-shadow 0.3s;
}

/* ❌ INTERDIT — transition: all */
.dish-card {
  transition: all 0.3s;
}
```

```css
/* ✅ CORRECT — @keyframes sur transform/opacity uniquement */
@keyframes fadeInUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
```

---

## 2. Interdictions JS (Memory & Listeners)

### 2.1 Idempotence — toutes les fonctions init*/bindEvents*

Toute fonction d'initialisation appelée plusieurs fois doit avoir une **garde d'idempotence** :

```javascript
let _initialized = false;

function initSomething() {
  if (_initialized) return;
  _initialized = true;
  // ajout listeners, création DOM…
}
```

### 2.2 URL.createObjectURL / revokeObjectURL

Tout `URL.createObjectURL()` doit avoir son `URL.revokeObjectURL()` correspondant :

```javascript
const url = URL.createObjectURL(blob);
img.onload = () => { URL.revokeObjectURL(url); };
img.onerror = () => { URL.revokeObjectURL(url); };
img.src = url;
```

### 2.3 Observers & Timers — cleanup obligatoire

Tout `IntersectionObserver` / `MutationObserver` / `ResizeObserver` / `setInterval` / `setTimeout` doit être stocké en variable et `disconnect()` / `clear()` avant recréation :

```javascript
let _observer = null;

function setupObserver() {
  if (_observer) _observer.disconnect();
  _observer = new IntersectionObserver(callback, options);
  _observer.observe(target);
}
```

```javascript
let _intervalId = null;

function startPolling(fn, ms) {
  stopPolling();
  _intervalId = setInterval(fn, ms);
}

function stopPolling() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}
```

### 2.4 Pas de listeners anonymes sur document/window

Tout `addEventListener` sur `document` ou `window` doit utiliser une fonction nommée (ou stockée en variable) pour permettre un éventuel `removeEventListener`.

---

## 3. Checklist : Avant de merger un changement visuel

À cocher manuellement (ou via code review) avant tout merge impactant le CSS, le JS ou le DOM.

### CSS
- [ ] Aucun `filter: drop-shadow()` sur du texte ou élément animé/hover
- [ ] Aucun `transition: all` — toutes les transitions listent des propriétés explicites
- [ ] `backdrop-filter` limité à ≤ 2 éléments visibles simultanément
- [ ] `@keyframes` n'anime que `transform` et/ou `opacity`
- [ ] Pas de `will-change` superflu
- [ ] Pas de `transform: translateZ(0)` inutile (pas de GPU layer forcing sans raison)

### JS
- [ ] Toute fonction `init*()` / `bindEvents()` a une garde d'idempotence
- [ ] Tout `URL.createObjectURL()` a son `URL.revokeObjectURL()` (dans onload + onerror)
- [ ] Tout `IntersectionObserver` / `MutationObserver` / `ResizeObserver` a un `disconnect()` avant recréation
- [ ] Tout `setInterval` a un `clearInterval` correspondant
- [ ] Tout `setTimeout` utilisé pour animation/retry a un chemin de cleanup
- [ ] Pas de listeners anonymes sur `document` / `window`

### DOM / HTML
- [ ] Les images `loading="lazy"` ont des `width` et `height` explicites
- [ ] Aucune vidéo/iframe n'est autoplay sans `playsinline` + `muted`
- [ ] Pas de `innerHTML` dans des boucles (utiliser `DocumentFragment`)

### Test (depuis la checklist Safari complète)
- [ ] Testé sur iPhone physique (pas uniquement simulateur)
- [ ] Testé sur Safari macOS
- [ ] Testé sur Chrome Android
- [ ] Testé au scroll et au clic rapide

---

## 4. Références

- `docs/SAFARI_WEBKIT_TROUBLESHOOTING.md` — Guide complet de diagnostic et fixes appliqués
- `docs/DESIGN_SYSTEM.md` — Palette et tokens (source of truth)
- `css/variables.css` — Variables CSS (transitions, ombres, couleurs)

---

*Document créé suite à la résolution de crash Safari/WebKit H1+C1+C2+M2+M4+M5+M6 (juin 2026).*
